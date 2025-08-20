FROM eclipse-temurin:21-jdk
WORKDIR /app

# Copy everything needed for Maven wrapper build
COPY backend/lumiroom/ .

# Ensure wrapper script is executable
RUN chmod +x mvnw

# Build the JAR
RUN ./mvnw clean package -DskipTests

# Run the app
EXPOSE 8080
CMD ["java", "-jar", "target/lumiroom-0.0.1-SNAPSHOT.jar"]
