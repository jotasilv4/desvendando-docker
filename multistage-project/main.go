package main

import (
	"fmt"
	"multistage-project/internal/api"
	"time"
)

func main() {
	server := api.Server{Port: ":8080"}
	
	go server.Routes()
	
	for {
		fmt.Println("Olá mundo, aqui está meus logs")
		time.Sleep(time.Second * 2)
	}
}