function loadVariables(self, url, target, method) {
    function randomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }
    
    /** @type {URL} */
    let ur = new URL(url, window.location.origin)
    let p = ur.searchParams
    
    switch(p.get('what')) {
        case 'getid':
            let uid = localStorage.getItem('uid')
            if (uid == null) {
                self.uid = uid = [...Array(64)].map(() => randomInt(16).toString(16)).join('')
                localStorage.setItem('uid', uid)
            } else {
                self.uid = uid
            }
            break;
        default:
            var xhr = new XMLHttpRequest();
            xhr.open("POST", '/web_archive/aperturescience.com/' + url.replace('.php', ''));
            xhr.send()
            self.okay = 'okay'
            break;
    }
}