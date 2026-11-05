package com.teducare.student;

/** Optional — null/blank generates a random password, same convention as UserManagerService.resetPassword. */
public record SetStudentPasswordRequest(String password) {
}
