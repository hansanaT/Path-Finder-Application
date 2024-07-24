import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from "react-router-dom";
import MapComponent from "./MapComponent";
import Geocoder from "./Geocoder";

const Location = require("./Utils/Location");
const Graph = require("./Utils/Graph");
const DistanceCalculator = require("./Utils/DistanceCalculator");
const BearingCalculator = require("./Utils/BearingCalculator");
const Dijkstra = require("./Utils/Dijkstra");

const Home = () => {
  const [navMap, setNavMap] = useState(false);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [error, setError] = useState(null);
  const [result, setResult] = useState("");
  const [userInput, setUserInput] = useState("");
  const [des, setDes] = useState({ latitude: null, longitude: null });
  const navigate = useNavigate();

  const getCoordinates = async () => {
    const geocoder = new Geocoder();
    try {
      const coordinates = await geocoder.getCoordinates(userInput);

      setResult(`Latitude: ${coordinates.lat}, Longitude: ${coordinates.lon}`);
      setDes({ latitude: coordinates.lat, longitude: coordinates.lon });
    } catch (error) {
      setResult("Error fetching the coordinates.");
    }
  };

  const submit = async () => {
    try {
      const graph = new Graph();
      const locA = new Location(location.latitude, location.longitude);
      const locB = new Location(des.latitude, des.longitude);

      graph.addLocation(locA);
      graph.addLocation(locB);

      const distance = DistanceCalculator.calculateDistance(locA, locB);
      graph.addEdge(locA, locB, distance);

      const previous = Dijkstra.dijkstra(graph, locA);
      const path = Dijkstra.getShortestPath(previous, locB);

      path.forEach((loc) =>
        console.log(`Lat: ${loc.latitude}, Lon: ${loc.longitude}`)
      );

      for (let i = 0; i < path.length - 1; i++) {
        console.log(`Go ${BearingCalculator.getDirection(path[i], path[i + 1])}`);
      }
      setNavMap(true)
    } catch (error) {
      setNavMap(false)
    }
  };

  const navigateMap = async () => {
    if(navMap)
      navigate("/map", { state: { location, des } });
  }

  useEffect(() => {
    if ("geolocation" in navigator) {
      const options = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      };

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
        },
        (error) => {
          setError(error.message);
        },
        options
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, []);

  return (
    <div>
      <h1>User's Location</h1>
      {error ? (
        <p>Error: {error}</p>
      ) : (
        <div>
          <p>Latitude: {location.latitude}</p>
          <p>Longitude: {location.longitude}</p>
        </div>
      )}
      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Enter a location name"
      />
      <button onClick={getCoordinates}>Get Coordinates</button>
      <p>{result}</p>
      <button onClick={submit}>Submit</button>
      <button onClick={navigateMap}>Navigate to UI Map</button>
      {/* <Link to="/map">Navigate to UI Map</Link> */}
    </div>
  );
};

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/map" element={<MapComponent />} />
    </Routes>
  </Router>
);

export default App;