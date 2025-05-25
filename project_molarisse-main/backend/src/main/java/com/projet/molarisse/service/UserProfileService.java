package com.projet.molarisse.service;

import com.projet.molarisse.dto.ProfileUpdateRequest;
import com.projet.molarisse.user.User;
import com.projet.molarisse.user.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserProfileService {
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Autowired
    public UserProfileService(UserRepository userRepository, FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    public User getUserProfile(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Transactional
    public User updateProfile(String email, ProfileUpdateRequest profileUpdateRequest) {
        User user = getUserProfile(email);
        
        // Update user fields
        user.setNom(profileUpdateRequest.getNom());
        user.setPrenom(profileUpdateRequest.getPrenom());
        user.setEmail(profileUpdateRequest.getEmail());
        user.setAddress(profileUpdateRequest.getAddress());
        user.setPhoneNumber(profileUpdateRequest.getPhoneNumber());

        return userRepository.save(user);
    }

    @Transactional
    public User updateProfilePicture(String email, MultipartFile file) {
        User user = getUserProfile(email);

        // Delete old profile picture if it exists
        if (user.getProfilePicturePath() != null) {
            fileStorageService.deleteFile(user.getProfilePicturePath());
        }

        // Store new profile picture
        String fileName = fileStorageService.storeFile(file);
        user.setProfilePicturePath(fileName);

        return userRepository.save(user);
    }
}
