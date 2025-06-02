package com.projet.molarisse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.projet.molarisse.user.SecretaryStatus;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SecretaryActionRequest {
    private Integer secretaryId;
    private SecretaryStatus action; // APPROVED or REJECTED
    private String message; // Optional message from doctor to secretary
} 