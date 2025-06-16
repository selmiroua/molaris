package com.projet.molarisse.user;

public enum SecretaryStatus {
    NONE,         // Not applied or not a secretary
    PENDING,      // Application submitted, waiting for review
    APPROVED,     // Application approved, working with doctor
    REJECTED      // Application rejected
} 