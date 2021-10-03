
    // Initialize the Cesium viewer.
    const viewer = new Cesium.Viewer('cesiumContainer', {
      imageryProvider: new Cesium.TileMapServiceImageryProvider({
        url: Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
      }),
      baseLayerPicker: false, geocoder: false, homeButton: false, infoBox: false,
      navigationHelpButton: false, sceneModePicker: false
    });
    // This causes a bug on android, see: https://github.com/CesiumGS/cesium/issues/7871
    // viewer.scene.globe.enableLighting = true;
    // These 2 lines are published by NORAD and allow us to predict where
    // the ISS is at any given moment. They are regularly updated.
    // Get the latest from: https://celestrak.com/satcat/tle.php?CATNR=25544. 

    let debris_TLE = tle;
   

    for (let debri of debris_TLE) {
        const satrec = satellite.twoline2satrec(
            debri.line1, debri.line2
          );

          // Give SatelliteJS the TLE's and a specific time.
        // Get back a longitude, latitude, height (km).
        // We're going to generate a position every 10 seconds from now until 6 seconds from now. 
        const totalSeconds = 60 * 60 * 6;
        const timestepInSeconds = 10;
        const start = Cesium.JulianDate.fromDate(new Date());
        const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());
        viewer.clock.startTime = start.clone();
        viewer.clock.stopTime = stop.clone();
        viewer.clock.currentTime = start.clone();
        viewer.timeline.zoomTo(start, stop);
        viewer.clock.multiplier = 40;
        viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
        
        const positionsOverTime = new Cesium.SampledPositionProperty();
        for (let i = 0; i < totalSeconds; i+= timestepInSeconds) {
        const time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
        const jsDate = Cesium.JulianDate.toDate(time);

        const positionAndVelocity = satellite.propagate(satrec, jsDate);
        const gmst = satellite.gstime(jsDate);
        const p   = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

        const position = Cesium.Cartesian3.fromRadians(p.longitude, p.latitude, p.height * 1000);
        positionsOverTime.addSample(time, position);
        }
        
        // Visualize the satellite with a red dot.
        const satellitePoint = viewer.entities.add({
        position: positionsOverTime,
        name: "testing",
        point: { pixelSize: 7, color: Cesium.Color.WHITE }
        });

    

        // Set the camera to follow the satellite 
        // viewer.trackedEntity = satellitePoint;
        // Wait for globe to load then zoom out     
        let initialized = false;
        viewer.scene.globe.tileLoadProgressEvent.addEventListener(() => {
        if (!initialized && viewer.scene.globe.tilesLoaded === true) {
            viewer.clock.shouldAnimate = true;
            initialized = true;
            //viewer.scene.camera.zoomOut(7000000);
            document.querySelector("#loading").classList.toggle('disappear', true)
        }
        });

        viewer.selectedEntityChanged.addEventListener(function(selectedEntity) {
          if (Cesium.defined(selectedEntity)) {
              if (Cesium.defined(selectedEntity.name)) {
                console.log('Selected ' + selectedEntity.name);
              } else {
                console.log('Unknown entity selected.');
              }
          } else {
            console.log('Deselected.');
          }
        });
    }
    