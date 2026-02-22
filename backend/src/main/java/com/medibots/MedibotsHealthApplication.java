package com.medibots;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
public class MedibotsHealthApplication {

    static {
        // Load .env.chat into system properties so chat works with plain "mvn spring-boot:run"
        String groq = System.getenv("GROQ_API_KEY");
        String hf = System.getenv("HF_TOKEN");
        if ((groq == null || groq.isBlank()) && (hf == null || hf.isBlank())) {
            try {
                Path file = Paths.get(System.getProperty("user.dir")).resolve(".env.chat");
                if (Files.exists(file)) {
                    for (String line : Files.readAllLines(file)) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eq = line.indexOf('=');
                        if (eq > 0) {
                            String key = line.substring(0, eq).trim();
                            String val = line.substring(eq + 1).trim();
                            if (val.length() >= 2 && val.startsWith("\"") && val.endsWith("\""))
                                val = val.substring(1, val.length() - 1);
                            else if (val.length() >= 2 && val.startsWith("'") && val.endsWith("'"))
                                val = val.substring(1, val.length() - 1);
                            if ("GROQ_API_KEY".equals(key) && (groq == null || groq.isBlank()))
                                System.setProperty("GROQ_API_KEY", val);
                            else if ("HF_TOKEN".equals(key) && (hf == null || hf.isBlank()))
                                System.setProperty("HF_TOKEN", val);
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }
        // Load .env.razorpay for payment keys
        String rzpKey = System.getProperty("RAZORPAY_KEY_ID");
        String rzpSecret = System.getProperty("RAZORPAY_KEY_SECRET");
        if (rzpKey == null || rzpKey.isEmpty()) rzpKey = System.getenv("RAZORPAY_KEY_ID");
        if (rzpSecret == null || rzpSecret.isEmpty()) rzpSecret = System.getenv("RAZORPAY_KEY_SECRET");
        if ((rzpKey == null || rzpKey.isBlank()) || (rzpSecret == null || rzpSecret.isBlank())) {
            try {
                Path file = Paths.get(System.getProperty("user.dir")).resolve(".env.razorpay");
                if (Files.exists(file)) {
                    for (String line : Files.readAllLines(file)) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eq = line.indexOf('=');
                        if (eq > 0) {
                            String key = line.substring(0, eq).trim();
                            String val = line.substring(eq + 1).trim();
                            if (val.length() >= 2 && val.startsWith("\"") && val.endsWith("\""))
                                val = val.substring(1, val.length() - 1);
                            else if (val.length() >= 2 && val.startsWith("'") && val.endsWith("'"))
                                val = val.substring(1, val.length() - 1);
                            if ("RAZORPAY_KEY_ID".equals(key)) System.setProperty("RAZORPAY_KEY_ID", val);
                            else if ("RAZORPAY_KEY_SECRET".equals(key)) System.setProperty("RAZORPAY_KEY_SECRET", val);
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }
    }

    public static void main(String[] args) {
        SpringApplication.run(MedibotsHealthApplication.class, args);
    }
}
