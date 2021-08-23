/*

Augmenta protocol :

https://github.com/Theoriz/Augmenta/wiki

This code has been tested on Chataigne 1.7.5+

*/

// The module currently display 5 objects maximum declared in module.json
var maxObjectsDisplayed = 5;

function init()
{
	local.parameters.oscOutputs.setCollapsed(true);
	local.parameters.pass_through.setCollapsed(true);
	local.values.singleObject.setCollapsed(true);
	local.values.fusion.setCollapsed(true);
	local.values.info.setCollapsed(true);
	local.values.info.node.setCollapsed(true);
	local.values.info.node.sensor.setCollapsed(true);
	local.values.info.node.debug.setCollapsed(true);
	local.scripts.setCollapsed(true);
	local.scripts.getChild("Augmenta").enableLog.set(true);

	for(var i = 0 ; i < maxObjectsDisplayed ; i++)
	{	
		local.values.getChild("object" + i).setCollapsed(true);
	}

	local.parameters.oscOutputs.enabled.set(false); // does not always work : strange
}

function moduleParameterChanged(param)
{

	if(param.is(local.parameters.singleObjectMode)) {

		if(local.parameters.singleObjectMode.get() == "none")
		{
			// Clean and fold single person object
			local.values.singleObject.setCollapsed(true);
			resetAugmentaObject(local.values.singleObject, args);

		} else {
			// Unfold single person object panel
			local.values.singleObject.setCollapsed(false);
		}
	} else if(param.is(local.parameters.displayObjectExtraData))
	{
		if(local.parameters.displayObjectExtraData.get())
		{
			local.values.singleObject.getChild("Extra").setCollapsed(false);
			for (var i = 0; i < maxObjectsDisplayed; i++) {

 				local.values.getChild("object"+i).getChild("Extra").setCollapsed(false);
			}
		} else
		{
			local.values.singleObject.getChild("Extra").setCollapsed(true);
			for (var i = 0; i < maxObjectsDisplayed; i++) {

 				local.values.getChild("object"+i).getChild("Extra").setCollapsed(true);
			}
		}
	}
}

function moduleValueChanged(value)
{
	if(value.is(local.values.info.requestInfo))
	{
		// Activate OSC Output
		local.parameters.oscOutputs.enabled.set(true);

		// Detect computer's IP

		var ipArray = util.getIPs();
		var ipToSend;

		for (var i = 0; i < ipArray.length ; i++) {
			
			if(ipArray[i].startsWith("192"))
			{
				ipToSend = ipArray[i];
			}
		}

		// Request Info
		script.log("Requesting /info to be sent to (should be this computer Ip) : ",ipToSend);
		// /info <serverIp:string> <ControlRemotePort:int> <version:int> sent to remoteIp:ControlRemotePort
		local.send("/info", ipToSend, local.parameters.oscInput.localPort.get(), 2);
		resetAugmentaInfo();
	}
}

function oscEvent(address,args)
{

	if(address == "/scene")
	{
		setAugmentaScene(local.values.scene, args);

	} else if(address == "/object/update")
	{

		// Update objects
		for(var i = 0 ; i < maxObjectsDisplayed ; i++)
		{
			 if(args[2] == i) //args[2] = oid
			 {
 				setAugmentaObject(local.values.getChild("object" + i), args);
			 }
		}

		// Update Oldest and newest
		// Oldest is always oid = 0 if algo is correctly implemented
		if(local.parameters.singleObjectMode.get() == "oldest" && args[2] == 0)
		{
			setAugmentaObject(local.values.singleObject, args);

		} else if(local.parameters.singleObjectMode.get() == "newest" && args[2] == getNewestId())
		{

			setAugmentaObject(local.values.singleObject, args);

		}

	} else if(address == "/object/enter")
	{
		// Update objects
		for(var i = 0 ; i < maxObjectsDisplayed ; i++)
		{
			 if(args[2] == i) //args[2] = oid
			 {
 				local.values.getChild("object" + i).setCollapsed(false);
 				setAugmentaObject(local.values.getChild("object" + i), args);
			 }
		}

		// Update Oldest and newest
		// Oldest is always oid = 0 if algo is correctly implemented
		if(local.parameters.singleObjectMode.get() == "oldest" && args[2] == 0)
		{
			setAugmentaObject(local.values.singleObject, args);

		} else if(local.parameters.singleObjectMode.get() == "newest" && args[2] == getNewestId())
		{
			setAugmentaObject(local.values.singleObject, args);
		}

	} else if(address == "/object/leave")
	{
		
		for(var i = 0 ; i < maxObjectsDisplayed ; i++)
		{
			 if(args[2] == i) //args[2] = oid
			 {
 				local.values.getChild("object" + i).setCollapsed(true);
 				resetAugmentaObject(local.values.getChild("object" + i), args);
			 }
		}

		// Reset Oldest and newest
		// Oldest is always oid = 0 if algo is correctly implemented
		if(local.parameters.singleObjectMode.get() == "oldest" && args[2] == 0)
		{
			resetAugmentaObject(local.values.singleObject);

		} else if(local.parameters.singleObjectMode.get() == "newest" && args[2] == getNewestId())
		{
			resetAugmentaObject(local.values.singleObject);
		}
	} else if(address == "/object/update/extra")
	{

		// Update objects
		for(var i = 0 ; i < maxObjectsDisplayed ; i++)
		{
			 if(args[2] == i) //args[2] = oid
			 {
 				setAugmentaExtraObject(local.values.getChild("object" + i).extra, args);
			 }
		}

		// Update Oldest and newest
		// Oldest is always oid = 0 if algo is correctly implemented
		if(local.parameters.singleObjectMode.get() == "oldest" && args[2] == 0)
		{
			setAugmentaExtraObject(local.values.singleObject.extra, args);

		} else if(local.parameters.singleObjectMode.get() == "newest" && args[2] == getNewestId())
		{

			setAugmentaExtraObject(local.values.singleObject.extra, args);

		}

	} else if(address == "/object/enter/extra")
	{
		// Update objects;
		for(var i = 0 ; i < maxObjectsDisplayed ; i++)
		{
			 if(args[2] == i) //args[2] = oid
			 {
 				local.values.getChild("object" + i).setCollapsed(false);
 				setAugmentaExtraObject(local.values.getChild("object" + i).extra, args);
			 }
		}

		// Update Oldest and newest
		// Oldest is always oid = 0 if algo is correctly implemented
		if(local.parameters.singleObjectMode.get() == "oldest" && args[2] == 0)
		{
			setAugmentaExtraObject(local.values.singleObject.extra, args);

		} else if(local.parameters.singleObjectMode.get() == "newest" && args[2] == getNewestId())
		{
			setAugmentaExtraObject(local.values.singleObject.extra, args);
		}

	} else if(address == "/object/leave/extra")
	{
		
		for(var i = 0 ; i < maxObjectsDisplayed ; i++)
		{
			 if(args[2] == i) //args[2] = oid
			 {
 				local.values.getChild("object" + i).setCollapsed(true);
 				resetAugmentaExtraObject(local.values.getChild("object" + i).extra, args);
			 }
		}

		// Reset Oldest and newest
		// Oldest is always oid = 0 if algo is correctly implemented
		if(local.parameters.singleObjectMode.get() == "oldest" && args[2] == 0)
		{
			resetAugmentaExtraObject(local.values.singleObject.extra);

		} else if(local.parameters.singleObjectMode.get() == "newest" && args[2] == getNewestId())
		{
			resetAugmentaExtraObject(local.values.singleObject.extra);
		}
	} else if(address == "/fusion")
	{
		setAugmentaFusion(local.values.fusion, args);

	} else if(address.startsWith("/info"))
	{
		setAugmentaInfo(address, args);
	}

	else if(address == "/au/scene")
	{
		script.logWarning(" : This module can display only V2 protocol data, not V1");
	}
}

function setAugmentaObject(object, args)
{
	object.hasData.set(true);
	object.frame.set(args[0]);
	object.id.set(args[1]);
	object.oid.set(args[2]);
	object.age.set(args[3]);
	object.centroid.set(args[4],args[5]);
	object.velocity.set(args[6],args[7]);
	object.orientation.set(args[8]);
	object.boundingRectCoord.set(args[9],args[10]);
	object.boundingRectWidth.set(args[11]);
	object.boundingRectHeight.set(args[12]);
	object.boundingRectRotation.set(args[13]);
	object.height.set(args[14]);
}

function setAugmentaExtraObject(object, args)
{
	object.frame.set(args[0]);
	object.id.set(args[1]);
	object.oid.set(args[2]);
	object.highest.set(args[3],args[4]);
	object.distance.set(args[5]);
	object.reflectivity.set(args[6]);
}

function resetAugmentaObject(object)
{
	object.hasData.set(false);
	object.frame.set(0);
	object.id.set(0);
	object.oid.set(0);
	object.age.set(0);
	object.centroid.set(0,0);
	object.velocity.set(0,0);
	object.orientation.set(0);
	object.boundingRectCoord.set(0,0);
	object.boundingRectWidth.set(0);
	object.boundingRectHeight.set(0);
	object.boundingRectRotation.set(0);
	object.height.set(0);
}

function resetAugmentaExtraObject(object)
{
	object.frame.set(0);
	object.id.set(0);
	object.oid.set(0);
	object.highest.set(0,0);
	object.distance.set(0);
	object.reflectivity.set(0);
}

function resetAugmentaInfo()
{
	var info = local.values.info;

	info.sourceName.set("");
	info.tags.set("");
	info.sourceType.set("");
	info.macAddress.set("");
	info.ipAddress.set("");
	info.version.set("");
	info.currentFile.set("");
	info.protocolsAvailable.set("");
	info.node.sensor.sensorType.set("");
	info.node.sensor.sensorBrand.set("");
	info.node.sensor.sensorName.set("");
	info.node.sensor.fov.set(0,0);
	info.node.sensor.position.set(0,0,0);
	info.node.sensor.orientation.set(0,0,0);
	info.node.floorMode.set("");
	info.node.floorState.set("");
	info.node.backgroundMode.set("");
	info.node.debug.pipeName.set("");
	info.node.debug.sensor.set("");
	info.node.debug.videoPipe.set("");
	info.node.debug.trackingPipe.set("");
	info.node.debug.processPID.set(0);
}

function setAugmentaInfo(address, args)
{
	var info = local.values.info;

	if(address == "/info/name")
	{
		info.sourceName.set(args[0]);

	} else if(address == "/info/tags")
	{
		info.tags.set(args[0]);

	} else if(address == "/info/type")
	{
		info.sourceType.set(args[0]);

	} else if(address == "/info/mac")
	{
		info.macAddress.set(args[0]);
		
	} else if(address == "/info/ip")
	{
		info.ipAddress.set(args[0]);
		
	} else if(address == "/info/version")
	{
		info.version.set(args[0]);
		
	} else if(address == "/info/currentFile")
	{
		info.currentFile.set(args[0]);
		
	} else if(address == "/info/protocolAvailable")
	{
		info.protocolsAvailable.set(args[0]);
		
	} else if(address == "/info/sensor/type")
	{
		info.node.sensor.sensorType.set(args[0]);
		
	} else if(address == "/info/sensor/brand")
	{
		info.node.sensor.sensorBrand.set(args[0]);
		
	} else if(address == "/info/sensor/name")
	{
		info.node.sensor.sensorName.set(args[0]);
		
	} else if(address == "/info/sensor/hfov")
	{
		info.node.sensor.hfov.set(args[0]);
		
	} else if(address == "/info/sensor/vfov")
	{
		info.node.sensor.vfov.set(args[0]);
		
	} else if(address == "/info/sensor/position")
	{
		info.node.sensor.position.set(args[0],args[1],args[2]);
		
	} else if(address == "/info/sensor/orientation")
	{
		info.node.sensor.orientation.set(args[0],args[1],args[2]);
		
	} else if(address == "/info/floorMode")
	{
		info.node.floorMode.set(args[0]);
		
	} else if(address == "/info/floorState")
	{
		info.node.floorState.set(args[0]);
		
	} else if(address == "/info/backgroundMode")
	{
		info.node.backgroundMode.set(args[0]);
		
	} else if(address == "/info/debug/pipeName")
	{
		info.node.debug.pipeName.set(args[0]);
		
	} else if(address == "/info/debug/sensor")
	{
		info.node.debug.sensor.set(args[0]);
		
	} else if(address == "/info/debug/videoPipe")
	{
		info.node.debug.videoPipe.set(args[0]);
		
	} else if(address == "/info/debug/trackingPipe")
	{
		info.node.debug.trackingPipe.set(args[0]);
		
	} else if(address == "/info/debug/pid")
	{
		info.node.debug.processPID.set(args[0]);
	}
}

function setAugmentaScene(scene, args)
{
	scene.frame.set(args[0]);
	scene.objectCount.set(args[1]);
	scene.width.set(args[2]);
	scene.height.set(args[3]);
}

function setAugmentaFusion(fusion, args)
{
	fusion.videoOutOffset.set(args[0],args[1]);
	fusion.videoOutSize.set(args[2],args[3]);
	fusion.videoOutWidthInPixels.set(args[4]);
	fusion.videoOutHeightInPixels.set(args[5]);
}

function getNewestId(args)
{
	if(local.values.scene.objectCount.get() > 0)
	{
		// Newest is last id of the scene so newest oid is objectCount-1
		return local.values.scene.objectCount.get() - 1;

	} else
	{
		// no object in the scene
		return -1;
	}
}
