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
			drawBaseCanvas(e.currentTarget);
			// this.redrawCanvas();
		};

		window.addEventListener("resize", () => {
			drawBaseCanvas(document.getElementById("my-img"));
			// this.redrawCanvas();
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
	const canvas = document.getElementById("my-canvas");
	const ctx = canvas.getContext("2d");

	// now we draw the image
	const imgRatio = (img.height / img.width);

	canvas.dataset.adjCanvasHeight = `${imgRatio * canvas.clientWidth}px`;

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
