package com.example.queue_project;

import com.example.queue_project.service.ScheduleService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class QueueProjectApplication {

	public static void main(String[] args) {
		SpringApplication.run(QueueProjectApplication.class, args);
	}

	@Bean
	public CommandLineRunner initializeData(ScheduleService scheduleService) {
		return args -> {
			System.out.println("\n=== Инициализация данных при старте приложения ===");

			// Пример: Заполнение расписания для конкретной группы
			Long targetGroupId = 57779L;


			System.out.println("Загрузка нового расписания...");
			int loadedCount = scheduleService.fillScheduleForGroup(targetGroupId);

			System.out.println("\nРезультат:");
			System.out.println("• Группа: " + targetGroupId);
			System.out.println("• Загружено занятий: " + loadedCount);
			System.out.println("=== Инициализация завершена ===\n");
		};
	}
}