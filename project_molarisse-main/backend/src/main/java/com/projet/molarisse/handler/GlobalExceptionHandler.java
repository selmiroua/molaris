package com.projet.molarisse.handler;

import jakarta.mail.MessagingException;
import jakarta.persistence.EntityNotFoundException;
import org.apache.catalina.connector.ClientAbortException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashSet;
import java.util.Set;

import static com.projet.molarisse.handler.BusinessErrorCodes.*;
import static org.springframework.http.HttpStatus.*;

@RestControllerAdvice

public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    /**
     * Handle client connection abort exceptions - common when streaming PDF files
     */
    @ExceptionHandler(ClientAbortException.class)
    public ResponseEntity<Void> handleClientAbortException(ClientAbortException e) {
        logger.debug("Client aborted connection: {}", e.getMessage());
        // Just return a 200 OK with no content - this won't actually be sent to the client
        // because they've already disconnected, but prevents excessive error logging
        return ResponseEntity.ok().build();
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ExceptionResponse> handleException(EntityNotFoundException exp) {
        return ResponseEntity
                .status(NOT_FOUND)
                .body(
                        ExceptionResponse.builder()
                                .businessErrorCode(USER_NOT_FOUND.getCode())
                                .businessExceptionDescription(USER_NOT_FOUND.getDescription())
                                .error(exp.getMessage())
                                .build()
                );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ExceptionResponse> handleException(IllegalArgumentException exp) {
        BusinessErrorCodes errorCode = EMAIL_ALREADY_EXISTS;
        if (exp.getMessage().equals("You can only modify your own profile")) {
            errorCode = NO_CODE; // Using NO_CODE for unauthorized profile modification
        }
        
        return ResponseEntity
                .status(BAD_REQUEST)
                .body(
                        ExceptionResponse.builder()
                                .businessErrorCode(errorCode.getCode())
                                .businessExceptionDescription(errorCode.getDescription())
                                .error(exp.getMessage())
                                .build()
                );
    }

    @ExceptionHandler(LockedException.class)

    public ResponseEntity<ExceptionResponse> handleException(LockedException exp ){
        return ResponseEntity
                .status(UNAUTHORIZED)
                .body(
                        ExceptionResponse.builder()
                                .businessErrorCode(ACCOUNT_LOCKED.getCode())
                                .businessExceptionDescription(ACCOUNT_LOCKED.getDescription())
                                .error(exp.getMessage())
                                .build()
                );

    }
    @ExceptionHandler(DisabledException.class)

    public ResponseEntity<ExceptionResponse> handleException(DisabledException exp ){
        return ResponseEntity
                .status(UNAUTHORIZED)
                .body(
                        ExceptionResponse.builder()
                                .businessErrorCode(ACCOUNT_DISABLED.getCode())
                                .businessExceptionDescription(ACCOUNT_DISABLED.getDescription())
                                .error(exp.getMessage())
                                .build()
                );

    }
    @ExceptionHandler(BadCredentialsException.class)

    public ResponseEntity<ExceptionResponse> handleException(BadCredentialsException exp ){
        return ResponseEntity
                .status(UNAUTHORIZED)
                .body(
                        ExceptionResponse.builder()
                                .businessErrorCode(BAD_CREDENTIALS.getCode())
                                .businessExceptionDescription(BAD_CREDENTIALS.getDescription())
                                .error(BAD_CREDENTIALS.getDescription())
                                .build()
                );

    }

@ExceptionHandler(MessagingException.class)

public ResponseEntity<ExceptionResponse> handleException(MessagingException exp ){
    return ResponseEntity
            .status(INTERNAL_SERVER_ERROR)
            .body(
                    ExceptionResponse.builder()
                            .error(exp.getMessage())
                            .build()
            );

}
    @ExceptionHandler(MethodArgumentNotValidException.class)

    public ResponseEntity<ExceptionResponse> handleException(MethodArgumentNotValidException exp ){
        Set<String> errors = new HashSet<>();
        exp.getBindingResult().getAllErrors().forEach(error -> {
            var errorMessage = error.getDefaultMessage();
            errors.add(errorMessage);
        });
        return ResponseEntity
                .status(BAD_REQUEST)
                .body(
                        ExceptionResponse.builder()
                                .validationErrors(errors)
                                .build()
                );

    }
    @ExceptionHandler(Exception.class)

    public ResponseEntity<ExceptionResponse> handleException(Exception exp ){
        exp.printStackTrace();
        return ResponseEntity
                .status(INTERNAL_SERVER_ERROR)
                .body(
                        ExceptionResponse.builder()
                                .businessExceptionDescription("Internal Error , contact the admin")
                                .error(exp.getMessage())
                                .build()
                );

    }
}