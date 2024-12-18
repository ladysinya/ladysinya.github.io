class CharacterDetails {
    data;

    async init() {
        await fetch('./data.json')
        .then(async (response) => {
            let responseContent = await response.text();
            this.data = JSON.parse(responseContent);
        });
        this.buildCharacterSelection();
    }

    buildCharacterSelection() {
        const modal = document.createElement('dialog');
        modal.innerHTML = `
            <header>Select a Character</header>
            <div id="character-list"></div>
        `;
        document.body.append(modal);

        const characterListContainer = document.getElementById('character-list');
        this.data.characters.forEach((char,i) => {
            const charButton = Object.assign(document.createElement('button'), {
                innerHTML: `${char.name.first} ${char.name.last}`,
                id: `char-select-button-${i}`
            })

            charButton.addEventListener('click', this.showCharacter.bind(this, i));

            characterListContainer.append(charButton);
        });

        modal.showModal();
    }

    showCharacter(i, e) {
        console.log('i', i);
        const charData = this.data.characters[i];
        console.log('items', charData.details.items.map(item => item.system?.activation?.type));

        const unknowns = charData.details.items.filter(item => item.system?.activation?.type == '' || item.system?.activation?.type == undefined);
        const actions = charData.details.items.filter(item => item.system?.activation?.type == 'action');
        const bonusActions = charData.details.items.filter(item => item.system?.activation?.type == 'bonus');
        const reactions = charData.details.items.filter(item => item.system?.activation?.type == 'reaction');
        const specialActions = charData.details.items.filter(item => item.system?.activation?.type == 'special');
        const noneActions = charData.details.items.filter(item => item.system?.activation?.type == 'none');

        console.log('unknowns', unknowns.map(a => ({ name: a.name, type: a.type })));
        console.log('actions', actions.map(a => ({ name: a.name, type: a.type })));
        console.log('bonusActions', bonusActions.map(a => ({ name: a.name, type: a.type })));
        console.log('reactions', reactions.map(a => ({ name: a.name, type: a.type })));
        console.log('specialActions', specialActions.map(a => ({ name: a.name, type: a.type })));
        console.log('noneActions', noneActions.map(a => ({ name: a.name, type: a.type })));

    }
}