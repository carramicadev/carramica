import React, { useState, useCallback, useRef } from "react";
import {
    GoogleMap,
    useJsApiLoader,
    Marker,
    Autocomplete,
} from "@react-google-maps/api";
import { Form } from "react-bootstrap";
import './MapComponent.css'
const containerStyle = {
    width: "100%",
    height: "400px",
};

const center = {
    lat: -6.197150,
    lng: 106.699000,
};

function MyComponent({ setKoordinateReceiver, koordinateReceiver }) {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: ["places"], // Add the 'places' library
    });

    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const autocompleteRef = useRef(null);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    const handleMapClick = (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        setMarker({ lat, lng });
        setKoordinateReceiver({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) })
    };

    const handlePlaceChanged = () => {
        const place = autocompleteRef.current.getPlace();
        console.log(place)
        if (place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setMarker({ lat, lng });
            setKoordinateReceiver({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) })
            map?.panTo?.({ lat, lng });
        }
    };
    console.log(autocompleteRef)
    return isLoaded ? (
        <>
            {/* <div></div> */}
            <Form.Label>Silahkan cari titik koordinat alamat anda!</Form.Label>
            <Autocomplete
                onLoad={(ref) => {
                    console.log(ref)
                    autocompleteRef.current = ref
                }}
                onPlaceChanged={handlePlaceChanged}
            >
                <Form.Control
                    className="input"
                    type="text"
                    placeholder="Cari daerah anda"
                    style={{ height: "40px", padding: "10px" }}
                />
            </Autocomplete>
            {koordinateReceiver.lat &&
                <><div className="input-note">latitude:{koordinateReceiver?.lat}</div>
                    <div style={{ marginBottom: "20px" }} className="input-note">longtitude:{koordinateReceiver?.lng}</div></>
            }
            {/* <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={10}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={handleMapClick}
            >
                {marker && <Marker position={marker} />}
            </GoogleMap> */}
        </>
    ) : (
        <></>
    );
}

export default React.memo(MyComponent);
