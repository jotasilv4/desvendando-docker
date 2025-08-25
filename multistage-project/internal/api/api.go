package api

import (
	"net/http"
	
	"github.com/labstack/echo/v4"
)

type Server struct {
	Port	string
}

func(s *Server) Run() *echo.Echo {
	return echo.New()
}

func(s *Server) Routes() {
	e := s.Run()
	
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hello World in golang")
	})
	
	// Start Server
	e.Logger.Fatal(e.Start(s.Port))
}
