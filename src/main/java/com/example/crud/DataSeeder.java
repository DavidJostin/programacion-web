package com.example.crud;

import com.example.crud.model.Product;
import com.example.crud.repository.ProductRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Inserts the 6 initial products when the table is empty.
 * Data persists in PostgreSQL, so on later startups the seed is skipped.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    public DataSeeder(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (productRepository.count() > 0) {
            return;
        }
        productRepository.saveAll(List.of(
                new Product("Laptop Pro 14", 1299.99, "Computers", 12,
                        "14-inch laptop with 16 GB RAM, 512 GB SSD and all-day battery life.",
                        "https://picsum.photos/seed/laptop/600/400"),
                new Product("Wireless Headphones", 199.50, "Audio", 40,
                        "Over-ear headphones with active noise cancelling and 30-hour battery.",
                        "https://picsum.photos/seed/headphones/600/400"),
                new Product("Smartphone X", 899.00, "Phones", 25,
                        "6.1-inch OLED display, triple camera and 128 GB storage.",
                        "https://picsum.photos/seed/smartphone/600/400"),
                new Product("Mechanical Keyboard", 89.90, "Accessories", 60,
                        "RGB mechanical keyboard with hot-swappable switches.",
                        "https://picsum.photos/seed/keyboard/600/400"),
                new Product("4K Monitor 27\"", 349.00, "Monitors", 18,
                        "27-inch IPS 4K monitor with HDR10 and USB-C power delivery.",
                        "https://picsum.photos/seed/monitor/600/400"),
                new Product("Smartwatch Fit", 149.99, "Wearables", 33,
                        "Fitness smartwatch with heart-rate monitor, GPS and sleep tracking.",
                        "https://picsum.photos/seed/smartwatch/600/400")
        ));
    }
}
