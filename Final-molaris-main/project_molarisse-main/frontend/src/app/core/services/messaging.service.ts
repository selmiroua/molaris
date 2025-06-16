import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderProfilePicture: string;
  recipientId: number;
  recipientName: string;
  recipientProfilePicture: string;
  content: string;
  mediaType?: 'IMAGE' | 'VOICE';
  mediaPath?: string;
  sentAt: Date | string;
  readAt: Date | string | null;
  isRead: boolean;
  isMine: boolean;
  edited?: boolean;
  editedAt?: Date | string;
}

export interface Conversation {
  partnerId: number;
  partnerName: string;
  partnerRole: string;
  profilePicture: string;
  lastMessageContent: string;
  lastMessageMediaType?: string;
  lastMessageMediaPath?: string;
  lastMessageTime: Date;
  isLastMessageMine: boolean;
  unreadCount: number;
}

export interface PartnerInfo {
  id: number;
  name?: string;
  nom?: string;
  prenom?: string;
  role?: string | { nom: string };
  profilePicture?: string;
  profilePicturePath?: string;
  status?: string;
}

export interface SendMessageRequest {
  recipientId: number;
  content: string;
  mediaType?: 'IMAGE' | 'VOICE';
  mediaPath?: string;
}

export interface PagedResponse {
  content: Message[];
  totalElements: number;
  totalPages: number;
}

// Add interface for raw API response
interface ConversationResponse {
  partnerId: number;
  partnerName: string;
  partnerRole: string;
  profilePicture: string;
  lastMessageContent: string;
  lastMessageMediaType?: string;
  lastMessageMediaPath?: string;
  lastMessageTime: string | Date;
  isLastMessageMine: boolean;
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/messages`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUnreadMessageCount();
    console.log('MessagingService initialized with API URL:', this.apiUrl);
  }

  // New method to get the original message date directly from the API
  getMessageDate(messageId: number): Observable<string> {
    return this.http.get<{sentAt: string}>(`${this.apiUrl}/${messageId}/date`).pipe(
      map(response => response.sentAt),
      catchError(error => {
        console.error(`Error fetching message date for message ${messageId}:`, error);
        return of('');
      })
    );
  }

  // Get all conversations for the current user
  getConversations(): Observable<Conversation[]> {
    return this.http.get<ConversationResponse[]>(`${this.apiUrl}/conversations`).pipe(
      map(conversations => {
        // Convert string dates to Date objects
        return conversations.map(conv => {
          let lastMessageTime: Date;
          try {
            const timeStr = typeof conv.lastMessageTime === 'string' 
              ? (conv.lastMessageTime.includes('Z') || conv.lastMessageTime.includes('+')
                  ? conv.lastMessageTime 
                  : conv.lastMessageTime + 'Z')
              : conv.lastMessageTime.toString();
            
            lastMessageTime = new Date(timeStr);
            
            // Check if the date is valid
            if (isNaN(lastMessageTime.getTime())) {
              console.warn(`Invalid lastMessageTime received from API: ${conv.lastMessageTime}`);
              lastMessageTime = new Date(); // Use current date as fallback
            }
          } catch (error) {
            console.error('Error processing lastMessageTime:', error);
            lastMessageTime = new Date(); // Use current date as fallback
          }
          
          return {
            ...conv,
            lastMessageTime
          };
        });
      }),
      catchError(error => {
        console.error('Error fetching conversations:', error);
        return of([]);
      })
    );
  }

  // Get conversation with another user - alias for backward compatibility
  getConversation(userId: number): Observable<Message[]> {
    return this.getMessages(userId);
  }

  // Get messages from a conversation with another user
  getMessages(userId: number): Observable<Message[]> {
    return this.http.get<any[]>(`${this.apiUrl}/conversations/${userId}`).pipe(
      map(messages => {
        if (messages && messages.length > 0) {
          console.log('Raw message date format from API:', {
            sentAtType: typeof messages[0].sentAt,
            sentAtValue: messages[0].sentAt,
            readAtType: typeof messages[0].readAt,
            readAtValue: messages[0].readAt,
            fullMessage: messages[0]
          });
        }
        
        // Convert string dates to Date objects and ensure correct typing
        return messages.map(msg => {
          try {
            // Store the original sentAt value for debugging
            const originalSentAt = msg.sentAt;
            
            // Handle sentAt date with explicit MySQL datetime format support
            let sentAtDate: Date | null = null;
            if (msg.sentAt) {
              if (typeof msg.sentAt === 'string') {
                // Check if it's a MySQL datetime format: "2025-05-05 23:19:02.000000"
                const mysqlDateRegex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.?(\d*)/;
                const match = msg.sentAt.match(mysqlDateRegex);
                
                if (match) {
                  // Extract date components
                  const year = parseInt(match[1]);
                  const month = parseInt(match[2]) - 1; // 0-based month
                  const day = parseInt(match[3]);
                  const hour = parseInt(match[4]);
                  const minute = parseInt(match[5]);
                  const second = parseInt(match[6]);
                  
                  // Create date object directly from components
                  sentAtDate = new Date(year, month, day, hour, minute, second);
                  console.log(`Parsed MySQL date from API: '${msg.sentAt}' → ${sentAtDate.toISOString()}`);
                } else {
                  // Try default approach for other formats
                  // Add 'Z' to treat as UTC if the string doesn't already have timezone info
                  const sentAtStr = !msg.sentAt.includes('Z') && !msg.sentAt.includes('+') 
                    ? msg.sentAt + 'Z' 
                    : msg.sentAt;
                  
                  sentAtDate = new Date(sentAtStr);
                }
                
                // Check if the date is valid
                if (isNaN(sentAtDate.getTime())) {
                  console.warn(`Invalid sentAt date received from API: ${msg.sentAt}`);
                  sentAtDate = new Date(); // Use current date as fallback
                }
              } else if (msg.sentAt instanceof Date) {
                sentAtDate = msg.sentAt;
              } else {
                console.warn(`Unknown sentAt date type: ${typeof msg.sentAt}`);
                sentAtDate = new Date(); // Use current date if no date provided
              }
            } else {
              sentAtDate = new Date(); // Use current date if no date provided
            }
            
            // Handle readAt date
            let readAtDate: Date | null = null;
            if (msg.readAt) {
              if (typeof msg.readAt === 'string') {
                // Check if it's a MySQL datetime format
                const mysqlDateRegex = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.?(\d*)/;
                const match = msg.readAt.match(mysqlDateRegex);
                
                if (match) {
                  // Extract date components
                  const year = parseInt(match[1]);
                  const month = parseInt(match[2]) - 1; // 0-based month
                  const day = parseInt(match[3]);
                  const hour = parseInt(match[4]);
                  const minute = parseInt(match[5]);
                  const second = parseInt(match[6]);
                  
                  // Create date object directly from components
                  readAtDate = new Date(year, month, day, hour, minute, second);
                } else {
                  // Add 'Z' to treat as UTC if the string doesn't already have timezone info
                  const readAtStr = !msg.readAt.includes('Z') && !msg.readAt.includes('+')
                    ? msg.readAt + 'Z'
                    : msg.readAt;
                    
                  readAtDate = new Date(readAtStr);
                }
                
                // Check if the date is valid
                if (isNaN(readAtDate.getTime())) {
                  console.warn(`Invalid readAt date received from API: ${msg.readAt}`);
                  readAtDate = null;
                }
              } else if (msg.readAt instanceof Date) {
                readAtDate = msg.readAt;
              }
            }
            
            // For debugging: Store the original sentAt value in a separate property
            const processedMessage = {
              ...msg,
              sentAt: sentAtDate,
              readAt: readAtDate,
              _originalSentAt: originalSentAt // Keep the original value for debugging
            } as Message & { _originalSentAt: any };
            
            // Log the first few messages to verify date processing
            if (messages.indexOf(msg) < 3) {
              console.log(`Message ${msg.id} date processing:`, {
                original: originalSentAt,
                processed: sentAtDate?.toISOString()
              });
            }
            
            return processedMessage;
          } catch (error) {
            console.error('Error processing message dates:', error);
            return {
              ...msg,
              sentAt: new Date(),
              readAt: null,
              _originalSentAt: msg.sentAt // Keep the original value for debugging
            } as Message & { _originalSentAt: any };
          }
        });
      }),
      tap(() => {
        // Update unread count after viewing a conversation
        this.loadUnreadMessageCount();
      }),
      catchError(error => {
        console.error(`Error fetching conversation with user ${userId}:`, error);
        return of([]);
      })
    );
  }

  // Get partner information
  getPartnerInfo(userId: number): Observable<PartnerInfo> {
    return this.http.get<PartnerInfo>(`${environment.apiUrl}/api/v1/api/users/${userId}/profile`).pipe(
      catchError(error => {
        console.error(`Error fetching partner info for user ${userId}:`, error);
        return of({ id: userId, name: `User ${userId}`, role: 'User' });
      })
    );
  }

  // Get paginated conversation
  getConversationPaged(userId: number, page: number = 0, size: number = 20): Observable<PagedResponse> {
    return this.http.get<any>(
      `${this.apiUrl}/conversations/${userId}/paged?page=${page}&size=${size}`
    ).pipe(
      map(response => {
        // Convert string dates to Date objects in the content array
        if (response.content) {
          response.content = response.content.map((msg: any) => {
            try {
              // Handle sentAt date
              let sentAtDate: Date | null = null;
              if (msg.sentAt) {
                // Add 'Z' to treat as UTC if the string doesn't already have timezone info
                const sentAtStr = typeof msg.sentAt === 'string' && !msg.sentAt.includes('Z') && !msg.sentAt.includes('+') 
                  ? msg.sentAt + 'Z' 
                  : msg.sentAt;
                
                sentAtDate = new Date(sentAtStr);
                
                // Check if the date is valid
                if (isNaN(sentAtDate.getTime())) {
                  console.warn(`Invalid sentAt date received from API: ${msg.sentAt}`);
                  sentAtDate = new Date(); // Use current date as fallback
                }
              } else {
                sentAtDate = new Date(); // Use current date if no date provided
              }
              
              // Handle readAt date
              let readAtDate: Date | null = null;
              if (msg.readAt) {
                // Add 'Z' to treat as UTC if the string doesn't already have timezone info
                const readAtStr = typeof msg.readAt === 'string' && !msg.readAt.includes('Z') && !msg.readAt.includes('+')
                  ? msg.readAt + 'Z'
                  : msg.readAt;
                  
                readAtDate = new Date(readAtStr);
                
                // Check if the date is valid
                if (isNaN(readAtDate.getTime())) {
                  console.warn(`Invalid readAt date received from API: ${msg.readAt}`);
                  readAtDate = null;
                }
              }
              
              return {
                ...msg,
                sentAt: sentAtDate,
                readAt: readAtDate
              } as Message;
            } catch (error) {
              console.error('Error processing message dates:', error);
              return {
                ...msg,
                sentAt: new Date(),
                readAt: null
              } as Message;
            }
          });
        }
        return response as PagedResponse;
      }),
      tap(() => {
        // Update unread count after viewing a conversation
        this.loadUnreadMessageCount();
      }),
      catchError(error => {
        console.error(`Error fetching paginated conversation with user ${userId}:`, error);
        return of({ content: [], totalElements: 0, totalPages: 0 } as PagedResponse);
      })
    );
  }

  // Send a text message (wrapper for backward compatibility)
  sendMessage(userId: number, content: string): Observable<Message> {
    const request: SendMessageRequest = {
      recipientId: userId,
      content: content
    };
    return this.sendMessageRequest(request);
  }

  // Send an image message
  sendImageMessage(userId: number, image: File, caption?: string): Observable<Message> {
    const formData = new FormData();
    formData.append('recipientId', userId.toString());
    formData.append('content', caption || '');
    formData.append('mediaType', 'IMAGE');
    formData.append('media', image, image.name);
    
    return this.sendMessageWithMedia(formData);
  }

  // Send a voice message
  sendVoiceMessage(userId: number, audioBlob: Blob, caption?: string): Observable<Message> {
    const formData = new FormData();
    const fileExtension = audioBlob.type.includes('webm') ? '.webm' : '.mp3';
    const audioFile = new File([audioBlob], `voice-message${fileExtension}`, { 
      type: audioBlob.type || 'audio/webm' 
    });
    
    formData.append('recipientId', userId.toString());
    formData.append('content', caption || '');
    formData.append('mediaType', 'VOICE');
    formData.append('media', audioFile, audioFile.name);
    
    return this.sendMessageWithMedia(formData);
  }

  // Internal method to send message request
  private sendMessageRequest(request: SendMessageRequest): Observable<Message> {
    return this.http.post<any>(`${this.apiUrl}`, request).pipe(
      map(message => {
        try {
          // Handle sentAt date
          let sentAtDate: Date | null = null;
          if (message.sentAt) {
            // Add 'Z' to treat as UTC if the string doesn't already have timezone info
            const sentAtStr = typeof message.sentAt === 'string' && !message.sentAt.includes('Z') && !message.sentAt.includes('+') 
              ? message.sentAt + 'Z' 
              : message.sentAt;
            
            sentAtDate = new Date(sentAtStr);
            
            // Check if the date is valid
            if (isNaN(sentAtDate.getTime())) {
              console.warn(`Invalid sentAt date received from API: ${message.sentAt}`);
              sentAtDate = new Date();
            }
          } else {
            sentAtDate = new Date();
          }
          
          // Handle readAt date
          let readAtDate: Date | null = null;
          if (message.readAt) {
            // Add 'Z' to treat as UTC if the string doesn't already have timezone info
            const readAtStr = typeof message.readAt === 'string' && !message.readAt.includes('Z') && !message.readAt.includes('+')
              ? message.readAt + 'Z'
              : message.readAt;
              
            readAtDate = new Date(readAtStr);
            
            // Check if the date is valid
            if (isNaN(readAtDate.getTime())) {
              console.warn(`Invalid readAt date received from API: ${message.readAt}`);
              readAtDate = null;
            }
          }
          
          return {
            ...message,
            sentAt: sentAtDate,
            readAt: readAtDate
          } as Message;
        } catch (error) {
          console.error('Error processing message dates:', error);
          return {
            ...message,
            sentAt: new Date(),
            readAt: null
          } as Message;
        }
      }),
      catchError(error => {
        console.error('Error sending message:', error);
        throw error;
      })
    );
  }

  // Send a message with media attachment
  sendMessageWithMedia(formData: FormData): Observable<Message> {
    return this.http.post<any>(`${this.apiUrl}/with-media`, formData).pipe(
      map(message => {
        try {
          // Handle sentAt date
          let sentAtDate: Date | null = null;
          if (message.sentAt) {
            // Add 'Z' to treat as UTC if the string doesn't already have timezone info
            const sentAtStr = typeof message.sentAt === 'string' && !message.sentAt.includes('Z') && !message.sentAt.includes('+') 
              ? message.sentAt + 'Z' 
              : message.sentAt;
            
            sentAtDate = new Date(sentAtStr);
            
            // Check if the date is valid
            if (isNaN(sentAtDate.getTime())) {
              console.warn(`Invalid sentAt date received from API: ${message.sentAt}`);
              sentAtDate = new Date();
            }
          } else {
            sentAtDate = new Date();
          }
          
          // Handle readAt date
          let readAtDate: Date | null = null;
          if (message.readAt) {
            // Add 'Z' to treat as UTC if the string doesn't already have timezone info
            const readAtStr = typeof message.readAt === 'string' && !message.readAt.includes('Z') && !message.readAt.includes('+')
              ? message.readAt + 'Z'
              : message.readAt;
              
            readAtDate = new Date(readAtStr);
            
            // Check if the date is valid
            if (isNaN(readAtDate.getTime())) {
              console.warn(`Invalid readAt date received from API: ${message.readAt}`);
              readAtDate = null;
            }
          }
          
          return {
            ...message,
            sentAt: sentAtDate,
            readAt: readAtDate
          } as Message;
        } catch (error) {
          console.error('Error processing message dates:', error);
          return {
            ...message,
            sentAt: new Date(),
            readAt: null
          } as Message;
        }
      }),
      catchError(error => {
        console.error('Error sending message with media:', error);
        throw error;
      })
    );
  }

  // Mark messages as read (supports both single ID and array of IDs)
  markAsRead(messageIds: number | number[]): Observable<any> {
    if (Array.isArray(messageIds)) {
      // If it's an array of IDs, mark multiple messages as read
      return this.http.put<any>(`${this.apiUrl}/batch/read`, { messageIds }).pipe(
        tap(() => {
          this.loadUnreadMessageCount();
        }),
        catchError(error => {
          console.error(`Error marking multiple messages as read:`, error);
          throw error;
        })
      );
    } else {
      // If it's a single ID, use the existing method
      return this.http.put<any>(`${this.apiUrl}/${messageIds}/read`, {}).pipe(
        map(message => ({
          ...message,
          sentAt: new Date(message.sentAt),
          readAt: message.readAt ? new Date(message.readAt) : null
        } as Message)),
        tap(() => {
          this.loadUnreadMessageCount();
        }),
        catchError(error => {
          console.error(`Error marking message ${messageIds} as read:`, error);
          throw error;
        })
      );
    }
  }

  // Mark all messages in a conversation as read
  markConversationAsRead(userId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/conversations/${userId}/read`, {}).pipe(
      tap(() => {
        this.loadUnreadMessageCount();
      }),
      catchError(error => {
        console.error(`Error marking conversation with user ${userId} as read:`, error);
        throw error;
      })
    );
  }

  // Get unread message count
  getUnreadMessageCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread/count`).pipe(
      tap(count => {
        this.unreadCountSubject.next(count);
      }),
      catchError(error => {
        console.error('Error fetching unread message count:', error);
        return of(0);
      })
    );
  }

  // Load the unread message count
  private loadUnreadMessageCount(): void {
    this.getUnreadMessageCount().subscribe();
  }

  // Delete a message
  deleteMessage(messageId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${messageId}`).pipe(
      catchError(error => {
        console.error(`Error deleting message ${messageId}:`, error);
        return throwError(() => error);
      })
    );
  }
  
  // Edit a message
  editMessage(messageId: number, newContent: string): Observable<Message> {
    return this.http.put<Message>(`${this.apiUrl}/${messageId}`, { content: newContent }).pipe(
      catchError(error => {
        console.error(`Error editing message ${messageId}:`, error);
        return throwError(() => error);
      })
    );
  }
} 