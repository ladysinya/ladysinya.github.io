class HTScript {
    people;
    lists;
    gifts;

    giftStatuses = [
        "selected",
        "purchased",
        "shipped",
        "received",
        "wrapped",
        "gifted",
        "other"
    ]
    
    async init() {
        await fetch('./Data/people.json')
            .then(async (response) => {
                let responseContent = await response.text();
                this.people = JSON.parse(responseContent);

                console.log(this.people);
            });
        
        await fetch('./Data/gifts.json')
            .then(async (response) => {
                let responseContent = await response.text();
                this.gifts = JSON.parse(responseContent);

                console.log(this.gifts);
            });

        this.loadPeople();
        this.setSectionListeners();
        
    }

    loadPeople() {
        const template = document.getElementById('people-card-template');
        const elem = template.content.querySelector(".people-card");

        const peopleSection = document.querySelector('.section-content [data-section="people"]');

        this.people.forEach(p => {
            const card = document.importNode(elem, true);
            card.querySelector('.people-card-name').innerHTML = p.name;
            card.querySelector('.people-card-budget').innerHTML = p.budget;

            card.querySelector('.people-card-address-line1').innerHTML = p.address.line1
            card.querySelector('.people-card-address-line2').innerHTML = p.address.line2
            card.querySelector('.people-card-address-city').innerHTML = p.address.city
            card.querySelector('.people-card-address-state').innerHTML = p.address.state
            card.querySelector('.people-card-address-zip').innerHTML = p.address.zip

            card.querySelector('.people-card-notes').innerHTML = p.notes;

            peopleSection.append(card);
        });
    }

    setSectionListeners() {
        const sectionBtns = Array.from(document.querySelectorAll('.section-btn'));

        sectionBtns.forEach(btn => {
            btn.addEventListener('click', this.sectionBtnClicked.bind(this));
        })
    }

    sectionBtnClicked(e) {
        const sectionBtns = Array.from(document.querySelectorAll('.section-btn'));
        
        sectionBtns.forEach(btn => {
            btn.classList.remove('section-active');
            const sectionContent = document.querySelector(`.section-content section[data-section=${btn.dataset.section}]`);
            sectionContent?.classList.add('display-none');
        });

        const targetBtn = e.target.matches('.section-btn')
                    ? e.target
                    : e.target.closest('.section-btn');

        targetBtn.classList.add('section-active');

        const newSectionContent = document.querySelector(`.section-content section[data-section=${targetBtn.dataset.section}]`);
        newSectionContent?.classList.remove('display-none');
    }
}