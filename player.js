var Player = 
{
	_mse : null,
	_url : null,
	_sourceBuffer : null,

	_segSeq : 0,
	_rep : null,
	_baseURL : null,

	_video : null,
	_templateURL : "seg-REPLACE-$RepresentationID$.m4v",
	_totSegments : 36,
	//_templateURL : "seg-REPLACE-dash-$RepresentationID$.m4v",
	//_totSegments : 150,
	
	init : function(url)
	{
		if(url)
		{ 
			Player._video = document.getElementById('video');
			Player._video.addEventListener('loadedmetadata',function() {
			setTimeout(Player.onProgress,200);
			});

			//Not loading MPD ... hard coded
			Player._url = url;
			Player.onMPDLoaded();
		}
		else
		{
			console.log("MPD url is not supplied");
		}

	},
	onMPDLoaded : function()
	{
		var li = Player._url.lastIndexOf("/");
		Player._baseURL = Player._url.substring(0,li);
        var hasWebKit = "WebKitMediaSource" in window, hasMediaSource = "MediaSource" in window;
        if (hasMediaSource) {
            Player._mse =  new MediaSource();
        } else if (hasWebKit) {
            Player._mse = new WebKitMediaSource();
		}

		Player._mse.addEventListener('sourceopen',function()
				{
					Player._mse.duration = 0;
					var mime = "video/mp4";
					var codecs = "avc1.64002a";
					Player._sourceBuffer = Player._mse.addSourceBuffer(mime + '; codecs="' + codecs + '"');
					Player._rep = "3MB2"; //rep id
					Player.loadSegment(); // load init seg
				});

		Player._video.src = window.URL.createObjectURL(Player._mse);

	},
	loadSegment : function()
	{
		var seq = ""+ Player._segSeq;
		while(seq.length < 8) seq = "0"+seq;
        var segURL = Player._templateURL.split("REPLACE").join(seq);
        segURL = segURL.split("$RepresentationID$").join(Player._rep);

		if(segURL)
		{
			try
			{
			segURL = Player._baseURL + "/"+segURL;
			var xhr = new XMLHttpRequest();
			xhr.open("GET", segURL);
			xhr.responseType = 'arraybuffer';
			xhr.addEventListener('loadend',function(evt)
			{
				if(evt.target.status < 200 || evt.target.status > 299)
				{
					console.log("Error loading the segment"); return;
				}
				var buf = new Uint8Array(evt.target.response);
				if(Player._sourceBuffer.appendBuffer)
						Player._sourceBuffer.appendBuffer(buf);
				else
						Player._sourceBuffer.append(buf);

				console.log("["+Player._segSeq+"] downloaded and appended successfully");

			});
			xhr.send();	
			console.log("xhr sent :"+segURL);
			}
			catch(e)
			{ console.log("Error loading the segment "+e.message);}
		}
	},
	
	onProgress : function()
	{
		Player._segSeq = Player._segSeq + 1;
		if( Player._segSeq < Player._totSegments)
		{
			Player.loadSegment();
			setTimeout(Player.onProgress,2000);
		}
		else
		{
			Player._mse.endOfStream();
		}
	},
   isTypeSupported : function(mime)
   {
       var webkitExists = "WebKitMediaSource" in window, mediaSourceExists = "MediaSource" in window;
       if (mediaSourceExists)
       {
           return MediaSource.isTypeSupported(mime);
       }
       else if (webkitExists)
       {
           return WebKitMediaSource.isTypeSupported(mime);
       }

       return false;
   }

};
