# syntax=docker/dockerfile:1.7

# ---------- Build ----------
FROM maven:3.9.9-amazoncorretto-21 AS build
WORKDIR /src

COPY pom.xml .
COPY entity ./entity
COPY base ./base
COPY messaging ./messaging
COPY authenticate ./authenticate
COPY business ./business
COPY app ./app

# Cache ~/.m2 giữa các lần build; code jOOQ đã commit nên không cần DB lúc build
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -DskipTests -pl app -am package

# ---------- Runtime ----------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app
COPY --from=build /src/app/target/aeoc-backend.jar app.jar
USER app

ENV SPRING_PROFILES_ACTIVE=dev \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -Duser.timezone=Asia/Ho_Chi_Minh"

EXPOSE 8088
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -qO- http://localhost:8088/api/actuator/health | grep -q '"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
