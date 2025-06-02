import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { MessagingComponent } from './messaging/messaging.component';
import { ConversationDetailComponent } from './messaging/conversation-detail/conversation-detail.component';

const routes: Routes = [
  {
    path: 'dashboard/messaging',
    component: MessagingComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/messaging/:id',
    component: MessagingComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/doctor/messaging',
    component: MessagingComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/doctor/messaging/:id',
    component: MessagingComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/doctor',
    children: [
      {
        path: 'messaging',
        component: MessagingComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'messaging/:id',
        component: MessagingComponent,
        canActivate: [AuthGuard]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 