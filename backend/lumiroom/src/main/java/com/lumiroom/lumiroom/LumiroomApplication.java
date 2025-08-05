package com.lumiroom.lumiroom;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@MapperScan("com.lumiroom.lumiroom.mapper") // temporary workaround
public class LumiroomApplication {

	public static void main(String[] args) {
		SpringApplication.run(LumiroomApplication.class, args);
	}

}
