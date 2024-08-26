class Keypad {
	code = "";

	init(code) {
        this.code = code;
        
		Array.from(document.querySelectorAll(".keypad-button")).forEach((btn) => {
			btn.addEventListener("click", this.btnClicked.bind(this));
		});

		const codeContainer = document.querySelector(".code-input-viewer-group");

		Array.from(this.code).forEach((char) => {
			const el = Object.assign(document.createElement("div"), {
				className: "code-input-viewer"
			});
			el.dataset.code = "";

			codeContainer.append(el);
		});

		this.successAudio = new Audio(
			"https://cdn.pixabay.com/audio/2022/03/24/audio_38187f352c.mp3"
		);

		this.failureAudio = new Audio(
			"https://cdn.pixabay.com/audio/2023/10/10/audio_3e4f4231e9.mp3"
		);
	}

	btnClicked(e) {
		const output = e.target.dataset.btnOut;
		const sAndODiv = document.querySelector(".status-and-input");
		const successAudio = new Audio(
			"https://cdn.pixabay.com/audio/2022/03/24/audio_38187f352c.mp3"
		);

		switch (output) {
			case "Enter":
				const codeEntries = Array.from(
					document.querySelectorAll(
						'.code-input-viewer[data-code]:not([data-code=""]'
					)
				);
				const code = [];
				codeEntries.forEach((entry) => {
					code.push(entry.dataset.code);
				});

				const shield = sAndODiv.querySelector(".fa-shield");

				if (code.join("") == this.code) {
					sAndODiv.dataset.status = "unlocked";

					shield.classList.add("shake");
					this.successAudio.play();
					setTimeout(() => {
						shield.classList.remove("shake");
					}, 2000);
				} else {
					sAndODiv.classList.add("locked-invalid");

					shield.classList.add("fastgrow");
					this.failureAudio.play();
					setTimeout(() => {
						shield.classList.remove("fastgrow");
					}, 2000);
				}

				break;
			case "Reset":
				Array.from(document.querySelectorAll(".code-input-viewer")).forEach(
					(btn) => {
						btn.setAttribute("data-code", "");
					}
				);

				sAndODiv.dataset.status = "locked";
				sAndODiv.classList.remove("locked-invalid");
				break;
			case "*":
				document
					.querySelector(".code-input-viewer-group")
					.classList.remove("show-code");
				break;
			case "#":
				document
					.querySelector(".code-input-viewer-group")
					.classList.add("show-code");
				break;

			default:
				document
					.querySelector('.code-input-viewer[data-code=""]')
					?.setAttribute("data-code", e.target.dataset.btnOut);
				break;
		}
	}
}