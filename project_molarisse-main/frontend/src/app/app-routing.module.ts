import { MessagingComponent } from './messaging/messaging.component';
import { ConversationDetailComponent } from './messaging/conversation-detail/conversation-detail.component';

const routes: Routes = [
  {
    path: 'dashboard/messaging',
    component: MessagingComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: ':id',
        component: ConversationDetailComponent
      }
    ]
  },
]; 