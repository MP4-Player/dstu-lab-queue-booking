package com.example.queue_project.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {
    @GetMapping("/")
    public String home() {
        return "index.html"; // Возвращает ваш HTML-файл
    }
}