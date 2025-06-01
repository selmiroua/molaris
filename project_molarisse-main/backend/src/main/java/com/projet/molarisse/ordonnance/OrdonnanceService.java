package com.projet.molarisse.ordonnance;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OrdonnanceService {
    @Autowired
    private OrdonnanceRepository ordonnanceRepository;

    public Ordonnance save(Ordonnance ordonnance) {
        return ordonnanceRepository.save(ordonnance);
    }

    public List<Ordonnance> findAll() {
        return ordonnanceRepository.findAll();
    }

    public Optional<Ordonnance> findById(Long id) {
        return ordonnanceRepository.findById(id);
    }

    public void deleteById(Long id) {
        ordonnanceRepository.deleteById(id);
    }
} 