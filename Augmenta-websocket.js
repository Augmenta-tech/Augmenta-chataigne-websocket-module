/*

Augmenta protocol :

https://github.com/Theoriz/Augmenta/wiki

This code has been tested on Chataigne 1.7.5+

*/

// The module currently display 5 objects maximum declared in module.json
var maxObjectsDisplayed = 5;

function init()
{

	local.parameters.pass_through.setCollapsed(true);
	local.values.singleObject.setCollapsed(true);
	local.values.fusion.setCollapsed(true);
	local.scripts.setCollapsed(true);
	local.scripts.getChild("augmenta_websocket").enableLog.set(true); // unknown function set : why ??

	for(var i = 0 ; i < maxObjectsDisplayed ; i++)
	{	
		local.values.getChild("object" + i).setCollapsed(true);
	}
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


function wsMessageReceived(message)
{

	// scene
	if (message.charAt(3) == 's') {
		// initialize or update scene
		setAugmentaScene(local.values.scene,message);
	}

	// fusion
	else if (message.charAt(3) == 'f') {
		// initialize or update fusion
		setAugmentaFusion(local.values.fusion,message);
	}

	// object
	else if (message.charAt(3) == 'o') {

		var msg = JSON.parse(message);

		if(message.charAt(15) == 'e') { // enter

			var oid = msg.object.enter.oid;

			// initialize object
			for(var i = 0 ; i < maxObjectsDisplayed ; i++)
			{
			 	if(oid == i)
			 	{
 					local.values.getChild("object" + i).setCollapsed(false);
 					setAugmentaObject(local.values.getChild("object" + i), message);
			 	}
			}

			// initialize oldest and newest
			// oldest is always oid = 0 if algo is correctly implemented
			if(local.parameters.singleObjectMode.get() == "oldest" && oid == 0)
			{
				setAugmentaObject(local.values.singleObject, message);

			} else if(local.parameters.singleObjectMode.get() == "newest" && oid == getNewestId())
			{
				setAugmentaObject(local.values.singleObject, message);
			}
				
		} else if(message.charAt(15) == 'u') { // update

			var oid = msg.object.update.oid;

			// update object
			for(var i = 0 ; i < maxObjectsDisplayed ; i++)
			{
				if(oid == i)
				{
 					updateAugmentaObject(local.values.getChild("object" + i), message);

 					// extra
 					if(local.parameters.displayObjectExtraData.get()) {
 						setAugmentaExtraObject(local.values.getChild("object" + i).extra, message);
 					}
				}
			}

			// update oldest and newest
			// oldest is always oid = 0 if algo is correctly implemented
			if(local.parameters.singleObjectMode.get() == "oldest" && oid == 0)
			{
				updateAugmentaObject(local.values.singleObject, message);

				// extra
				if(local.parameters.displayObjectExtraData.get()) {
 					setAugmentaExtraObject(local.values.singleObject.extra, message);
 				}

			} else if(local.parameters.singleObjectMode.get() == "newest" && oid == getNewestId())
			{

				updateAugmentaObject(local.values.singleObject, message);

				// extra
				if(local.parameters.displayObjectExtraData.get()) {
 					setAugmentaExtraObject(local.values.singleObject.extra, message);
 				}

			}

		} else if(message.charAt(15) == 'l') { //leave
					
			var oid = msg.object.leave.oid;

			// reset object	
			for(var i = 0 ; i < maxObjectsDisplayed ; i++)
			{
			 	if(oid == i)
			 	{
 					local.values.getChild("object" + i).setCollapsed(true);
 					resetAugmentaObject(local.values.getChild("object" + i));

 					// extra
 					if(local.parameters.displayObjectExtraData.get()) {
 						resetAugmentaExtraObject(local.values.getChild("object" + i).extra, message);
 					}
			 	}
			}

			// reset oldest and newest
			// oldest is always oid = 0 if algo is correctly implemented
			if(local.parameters.singleObjectMode.get() == "oldest" && oid == 0)
			{
				resetAugmentaObject(local.values.singleObject);

				// extra
				if(local.parameters.displayObjectExtraData.get()) {
 					setAugmentaExtraObject(local.values.singleObject.extra, message);
 				}

			} else if(local.parameters.singleObjectMode.get() == "newest" && oid == getNewestId())
			{
				resetAugmentaObject(local.values.singleObject);

				// extra
				if(local.parameters.displayObjectExtraData.get()) {
 					setAugmentaExtraObject(local.values.singleObject.extra, message);
 				}
			}
		}
	}		
}

// scene updated or initialized
function setAugmentaScene (scene,message) 
{
	var msg = JSON.parse(message);

	scene.frame.set(msg.scene.frame);
	scene.objectCount.set(msg.scene.objectCount);
	scene.width.set(msg.scene.scene.width);
	scene.height.set(msg.scene.scene.height);
}

// fusion updated or initialized
function setAugmentaFusion(fusion,message)
{
	var msg = JSON.parse(message);

	fusion.videoOutOffset.set(msg.fusion.textureOffset.x,msg.fusion.textureOffset.y);
	fusion.videoOutSize.set(msg.fusion.targetOutSize.x,msg.fusion.targetOutSize.y);
	fusion.videoOutWidthInPixels.set(msg.fusion.textureBounds.x);
	fusion.videoOutHeightInPixels.set(msg.fusion.textureBounds.y);
}

// called on object entered
function setAugmentaObject (object,message) 
{
	var msg = JSON.parse(message);

	object.hasData.set(true);
	object.frame.set(msg.object.enter.frame);
	object.id.set(msg.object.enter.id);
	object.oid.set(msg.object.enter.oid);
	object.age.set(msg.object.enter.age);
	object.centroid.set(msg.object.enter.centroid.x, msg.object.enter.centroid.y);
	object.velocity.set(msg.object.enter.velocity.x, msg.object.enter.velocity.y);
	object.orientation.set(msg.object.enter.orientation);
	object.boundingRectCoord.set(msg.object.enter.boundingRect.x, msg.object.enter.boundingRect.y);
	object.boundingRectWidth.set(msg.object.enter.boundingRect.width);
	object.boundingRectHeight.set(msg.object.enter.boundingRect.height);
	object.boundingRectRotation.set(msg.object.enter.orientation); // different from orientation ?
	object.height.set(msg.object.enter.height);
}

// called on object updated
function updateAugmentaObject (object,message) 
{
	var msg = JSON.parse(message);

	object.hasData.set(true);
	object.frame.set(msg.object.update.frame);
	object.id.set(msg.object.update.id);
	object.oid.set(msg.object.update.oid);
	object.age.set(msg.object.update.age);
	object.centroid.set(msg.object.update.centroid.x, msg.object.update.centroid.y);
	object.velocity.set(msg.object.update.velocity.x, msg.object.update.velocity.y);
	object.orientation.set(msg.object.update.orientation);
	object.boundingRectCoord.set(msg.object.update.boundingRect.x, msg.object.update.boundingRect.y);
	object.boundingRectWidth.set(msg.object.update.boundingRect.width);
	object.boundingRectHeight.set(msg.object.update.boundingRect.height);
	object.boundingRectRotation.set(msg.object.update.orientation); // different from orientation ?
	object.height.set(msg.object.update.height);
}

// called on object left 
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

// Extra

function setAugmentaExtraObject(object, message)
{
	var msg = JSON.parse(message);

	//script.log(msg.update.extra.distance);

	object.frame.set(msg.object.update.extra.frame);
	object.id.set(msg.object.update.extra.id);
	object.oid.set(msg.object.update.extra.oid);
	object.highest.set(msg.update.extra.highest.x,msg.update.extra.highest.y);
	object.distance.set(msg.update.extra.distance);
	object.reflectivity.set(msg.update.extra.reflectivity);
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

function getNewestId(args)
{
	if(local.values.scene.objectCount.get() > 0)
	{
		// newest is last id of the scene so newest oid is objectCount-1
		return local.values.scene.objectCount.get() - 1;

	} else
	{
		// no object in the scene
		return -1;
	}
}
