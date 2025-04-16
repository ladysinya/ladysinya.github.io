class CanvasDraw {
	tagsToDraw = [
		new Tag('signature', 148, 392, 958, 52)
	]

	async init() {
		const img = new Image();
		const documents = await getDocuments();
		img.src = documents[0];
		img.id = "my-img";
		img.onload = (e) => {
			document.body.appendChild(e.currentTarget);
			[this.cHeight, this.cWidth] = drawBaseCanvas(e.currentTarget);
			this.redrawCanvas();
		};

		window.addEventListener("resize", () => {
			drawBaseCanvas(document.getElementById("my-img"));
			this.redrawCanvas();
		});

		window.addEventListener('click', (e) => { console.log('offsetX', e.offsetX, 'offsetY', e.offsetY) })
	}

	redrawCanvas() {
		const canvas = document.getElementById("my-canvas");
		const ctx = canvas.getContext('2d');
		this.tagsToDraw.forEach(tag =>  {
			tag.draw(ctx)
		});
	}
}

// class DocumentsDraw {
// 	draw(canvas) {

// 	}
// }

function drawBaseCanvas(img) {
	console.log("doing canvas shit");
	const canvas = document.getElementById("my-canvas");

	const dpr = window.devicePixelRatio;
	canvas.width = canvas.clientWidth * dpr;
	canvas.height = canvas.clientHeight * dpr;

	const ctx = canvas.getContext("2d");
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";

	const hRatio = canvas.width / img.width;
	const adjImgWidth = img.width * hRatio;
	const adjImgHeight = img.height * hRatio;

	const adjCanvasHeight = (img.height / img.width) * canvas.width;
	canvas.dataset.adjCanvasHeight = `${adjCanvasHeight}px`;

	const centerShift_x = (canvas.width - adjImgWidth) / 2;

	// Setting these again seems hacky, but it works. I don't yet understand why.
	canvas.width = canvas.clientWidth * dpr;
	canvas.height = canvas.clientHeight * dpr;

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(img, centerShift_x, 0, adjImgWidth, adjImgHeight);

	return [canvas.height, canvas.width];
}

async function getDocuments() {
	let docs;
	await fetch(`./documents.json`)
		.then(async (response) => {
			let responseContent = await response.text();
			docs = JSON.parse(responseContent);
		});

	return docs.documents;
}
