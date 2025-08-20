# Build stage
FROM maven:3.9.2-eclipse-temurin-21 AS build
WORKDIR /app
COPY backend/lumiroom/ .      
# copies pom.xml + src + all files
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/lumiroom-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
