FROM golang:1.25-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64

RUN go build -o multi-api main.go

# ----

FROM alpine AS prod

WORKDIR /app

COPY --from=build /app/multi-api .

CMD ["./multi-api"]
