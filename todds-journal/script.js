// const token = localStorage.getItem("token");
// localStorage.setItem(
// 					"token",
// 					JSON.stringify({
// 						timestamp: Date.now(),
// 						token: token
// 					})
// 				);

class Journal {
	init() {
		const pages = Array.from(
			document.querySelectorAll('.page:not([data-order="0"])')
		);
		pages.forEach((page) => {
			['click', 'touchstart'].forEach((event) => {
				page.addEventListener(event, this.pageClicked.bind(this));
			})
			
		});

		const allTabs = document.querySelectorAll(".tab");
		Array.from(allTabs).forEach((tab) => {
			tab.addEventListener("click", this.tabClicked.bind(this));
		});

		this.organizeTabs();
	}

	pageClicked(e) {
		const page = e.currentTarget;
		this.turnPage(page);
	}

	turnPage(pageElem) {
		const pageTurnDurration = 900;
		let turningForward = true;
		if (pageElem.matches(".page-turned")) {
			pageElem.classList.remove("page-turned");
			document
				.querySelector(`.tab[data-page="${pageElem.dataset.order}"]`)
				?.classList.remove("tab-flipped");
			pageElem.removeAttribute("style");
			turningForward = false;
		} else {
			pageElem.classList.add("page-turned");
			document
				.querySelector(`.tab[data-page="${pageElem.dataset.order}"]`)
				?.classList.add("tab-flipped");
			const zIndex = (100 - parseInt(pageElem.dataset.order)) * -1;
			setTimeout(() => {
				pageElem.setAttribute("style", `z-index: ${zIndex}`);
			}, 1000);
		}

		this.organizeTabs(pageTurnDurration, turningForward);
	}

	organizeTabs(pageTurnDurration, turningForward) {
		const allTabs = Array.from(document.querySelectorAll(".tab"));
		const flippedTabs = Array.from(document.querySelectorAll(".tab-flipped"));
		const notFlippedTabs = Array.from(
			document.querySelectorAll(".tab:not(.tab-flipped)")
		);

		const flippedTransitionTime = turningForward ? pageTurnDurration : 0;
		const notFlippedTransitionTime = turningForward ? 0 : pageTurnDurration;

		allTabs.forEach((tab) => {
			const flippedIndex =
				flippedTabs.findIndex((t) => t.dataset.page == tab.dataset.page) ?? 0;
			const notFlippedIndex =
				notFlippedTabs.findIndex((t) => t.dataset.page == tab.dataset.page) ?? 0;

			if (tab.matches(".tab-flipped")) {
				const offset = -28;

				setTimeout(() => {
					tab.removeAttribute("style");
					tab.style.left = `${offset}px`;
				}, flippedTransitionTime);
			} else {
				const diff = notFlippedTabs.length - notFlippedIndex;
				const offset = -50 - 8 * notFlippedIndex;
				setTimeout(() => {
					tab.removeAttribute("style");
					tab.style.right = `${offset}px`;
				}, notFlippedTransitionTime);
			}
		});
	}

	async tabClicked(e) {
		const page = e.currentTarget.dataset.page;
		const tabs = document.querySelectorAll(".tab");
		const currentPage = document.querySelector(".tab:not(.tab-flipped)")?.dataset
			.page;

		if (e.currentTarget.matches(".tab-flipped")) {
			for (let i = currentPage - 1; i >= page; i--) {
				const page = document.querySelector(`.page[data-order="${i}"]`);
				this.turnPage(page);

				await this.sleep(250);
			}
		} else {
			for (let i = currentPage; i < page; i++) {
				const page = document.querySelector(`.page[data-order="${i}"]`);
				this.turnPage(page);

				await this.sleep(250);
			}
		}
	}

	sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}