package com.projet.molarisse.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebConfig.class);

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
        for (HttpMessageConverter<?> converter : converters) {
            if (converter instanceof MappingJackson2HttpMessageConverter) {
                MappingJackson2HttpMessageConverter jacksonConverter = (MappingJackson2HttpMessageConverter) converter;
                List<MediaType> supportedMediaTypes = jacksonConverter.getSupportedMediaTypes();
                supportedMediaTypes = new java.util.ArrayList<>(supportedMediaTypes);
                supportedMediaTypes.add(new MediaType("application", "json", java.nio.charset.StandardCharsets.UTF_8));
                jacksonConverter.setSupportedMediaTypes(supportedMediaTypes);
            }
        }
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // CORS configuration is handled in SecurityConfig
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Get the upload path
        Path uploadPath = Paths.get(uploadDir);
        String uploadAbsolutePath = uploadPath.toFile().getAbsolutePath();
        logger.info("Configuring resource handlers with upload path: {}", uploadAbsolutePath);
        
        // Register resource handler for profile pictures
        registry.addResourceHandler("/api/users/profile/picture/**")
                .addResourceLocations("file:" + uploadAbsolutePath + "/")
                .setCachePeriod(3600)
                .resourceChain(true);
                
        // Register resource handler for patient documents
        registry.addResourceHandler("/api/patients/*/fiche/document/**")
                .addResourceLocations("file:" + uploadAbsolutePath + "/")
                .setCachePeriod(3600)
                .resourceChain(true);
                
        // Register resource handler for static resources
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(3600)
                .resourceChain(true);
    }
}