import { AirplaneDetected, EventServiceClient, GameServiceClient, GameStopped, getCredentials, ServiceError, StartGameRequest, StartGameResponse, StreamRequest, StreamResponse } from "auto-traffic-control"

function main() {
  subscribeToEvents();
  startGame();
}

main()

function startGame(): void {
  const gameService = new GameServiceClient("localhost:4747", getCredentials());

  gameService.startGame(new StartGameRequest(), (error) => {
    if (error !== null) throw error

    console.log("Started a new game.")
  })
}


function subscribeToEvents(): void {
  const eventService = new EventServiceClient(
    "localhost:4747",
    getCredentials()
  )

  const stream = eventService.stream(new StreamRequest());

  stream.on("data", processMessage)

  stream.on("end", exit);
}

function processMessage(streamResponse: StreamResponse): void {
  const airplaneDetected = streamResponse.getAirplaneDetected();

  if (airplaneDetected !== undefined) {
    updateFlightPlan(airplaneDetected)
  }

  const gameStopped = streamResponse.getGameStopped();

  if (gameStopped !== undefined) {
    exit(gameStopped);
  }
}

function exit(event: GameStopped): void {
  const score = event.getScore();

  console.log(`Game stopped. Score: ${score}`)

  process.exit();
}

function updateFlightPlan(event: AirplaneDetected): void {
  const airplane = event.getAirplane();

  if (!airplane) throw new Error("Received AirplaneDetected event without an airplane");

  const id = airplane.getId();
  const flightPlan = airplane.getFlightPlanList();
  const nextNode = flightPlan.at(0);

  console.log(`Detected airplane ${id} heading toward ${nextNode}.`);
}
