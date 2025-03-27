package com.example.queue_project;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class QueueProjectApplication {

	public static void main(String[] args) {
		SpringApplication.run(QueueProjectApplication.class, args);
	}
}