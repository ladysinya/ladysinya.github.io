class Home {
    data;
    channel = new BroadcastChannel('ladysinya.github.io_family_feud_broadcast_channel');
    qNumber = 0;
    
    async init() {
        this.channel.addEventListener('message', e => this.messageEventListener(e))
    }

    messageEventListener(message) {
        console.log('event', message);
    }

    onSignIn(googleUser) {
        var profile = googleUser.getBasicProfile();
        console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
        console.log('Name: ' + profile.getName());
        console.log('Image URL: ' + profile.getImageUrl());
        console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
    }

    signOut() {
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(() => {
            console.log('User signed out.');
        });
    }
}