package com.echospace;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@MapperScan("com.echospace.mapper") // temporary workaround
public class EchospaceApplication {

	public static void main(String[] args) {
		SpringApplication.run(EchospaceApplication.class, args);
	}

}
