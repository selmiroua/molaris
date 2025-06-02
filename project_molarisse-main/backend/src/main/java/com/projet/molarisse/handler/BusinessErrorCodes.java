package com.projet.molarisse.handler;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import static org.springframework.http.HttpStatus.*;

public enum BusinessErrorCodes {
    NO_CODE(0, NOT_IMPLEMENTED,"no code"),

    INCORRECT_CURRENT_PASSWORD(300,BAD_REQUEST,"incorrect current password"),
    NEW_PASSWORD_DOES_NOT_MATCH(301,BAD_REQUEST,"the new password does not match"),
    ACCOUNT_LOCKED(302,FORBIDDEN,"account locked"),
    ACCOUNT_DISABLED(303,FORBIDDEN,"user disabled"),
    BAD_CREDENTIALS(304,FORBIDDEN,"Login and / or password is incorrect "),
    USER_NOT_FOUND(305,NOT_FOUND,"User not found"),
    EMAIL_ALREADY_EXISTS(306,CONFLICT,"Email already exists"),
    UNAUTHORIZED_PROFILE_MODIFICATION(307,FORBIDDEN,"You can only modify your own profile"),

    ;
    @Getter
    private int code;
    @Getter
    private HttpStatus httpStatus;
    @Getter
    private String description;

    BusinessErrorCodes(int code, HttpStatus httpStatus, String description) {
        this.code = code;
        this.httpStatus = httpStatus;
        this.description = description;
    }
}
