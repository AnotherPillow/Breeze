const check_login = () => {
    let body = {
        username: document.querySelector('#login_username').value,
        password: document.querySelector('#login_password').value
    };
    fetch(`${document.location.origin}/api/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(res => res.json()).then(data => {
        if (data.code === 200) {
            //redirect to ,essaging page
            window.location = `${document.location.origin}/messaging?username=${body.username}&password=${body.password}`;
        } else {
            //display error
            alert(data.message);
        }
    })
}
const signup = () => {
    let body = {
        username: document.querySelector('#signup_username').value,
        password: document.querySelector('#signup_password').value.trim(),
        password2: document.querySelector('#signup_password2').value.trim()
    };
    if (body.password !== body.password2) return alert('Passwords do not match.');
    if (body.password.length < 8) return alert('Password must be at least 8 characters long.');
    fetch(`${document.location.origin}/api/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(res => res.json()).then(data => {
        if (data.code === 200) {
            window.location = `${document.location.origin}/messaging?username=${body.username}&password=${body.password}`;
        } else {
            //display error
            alert(data.message);
        }
    })
}
if (window.location.pathname === '/messaging') {
    document.addEventListener('DOMContentLoaded', () => {
        let el = document.getElementById('group_list');
        let name = PAGE_DATA.username;
        fetch(`${document.location.origin}/api/groups?username=${name}`).then(res => res.json()).then(data => {
            if (data.code === 200) {
                data.groups.forEach(group => {
                    console.log(group);
                    let img = document.createElement('img');
                    img.src = `https://api.dicebear.com/5.x/icons/svg?seed=${encodeURIComponent(group.name)}`;
                    img.width = 100;
                    img.height = 100;
                    img.classList.add('group-img');
                    img.setAttribute('onclick', `console.log('${group.id}');currentGroup = ${parseInt(group.id)};`);
                    el.appendChild(img);
                })
            }
        })
        document.querySelector('#message_input').addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                sendMessage(e.target.value);
                e.target.value = '';
            }
        })
    })
}

let currentTempGroup = null;
let latestMessage = {};
let currentGroup = null;
const appendMessage = (message) => {
    document.querySelector('.messages_container').appendChild(message);
    scrollMessages();
}
const generateMessage = (username,message) => {
    if (!username || !message) {
        username = 'Nobody has talked yet'
        message = 'Be the first to send a message!';
    }
    let el = document.createElement('div');
    el.classList.add('message');
    el.innerHTML = `<div class="message_avatar_username">
    <img class="message_avatar" src="https://api.dicebear.com/5.x/bottts/svg?seed=${username === 'Nobody has talked yet'? 'Nobody has talked yet.' : username}" alt="avatar" height="75" width="75">
    <h3 class="message_sender">${username}</h3>
    </div>
    <br>
    
    <p class="message_text">${message}</p>`
    return el;
}
const sendMessage = (content) => {
    let body = {
        username: PAGE_DATA.username,
        password: PAGE_DATA.password,
        message: content,
        group_id: currentGroup
    }
    fetch(`${document.location.origin}/api/message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(res => res.json()).then(data => {
        if (data.code === 200) {
            document.querySelector('.messages_container').appendChild(generateMessage(body.username,body.message));
            latestMessage = {
                code: data.code,
                message: data.file.latest,
                name: data.file.name,
                members: data.file.members,
                id: data.file.id.toString()

            }
        } else if  (data.code === 403) {
            alert('You are not logged in.');
            window.location = `${document.location.origin}/signup`;
        } else {
            alert(`Error sending message: ${data.message}`);
        }
    })
}
const scrollMessages = _ => document.querySelector('.messages_container').scrollTop = document.querySelector('.messages_container').scrollHeight + 10;

const getLatestMessage = (group_id) => {
    console.log('getting latest message');
    console.log(group_id);
    fetch(`${document.location.origin}/api/latest_message`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            group_id
        })
    }).then(res => res.json()).then(data => {
        if (data.code === 200) {
            if (data === latestMessage || JSON.stringify(data) === JSON.stringify(latestMessage)) return;
            console.log(data === latestMessage);
            console.log(JSON.stringify(data) === JSON.stringify(latestMessage));
            console.log(JSON.stringify(data));
            console.log(JSON.stringify(latestMessage));
            console.log(data);
            console.log(latestMessage);
            latestMessage = data;
            return appendMessage(generateMessage(data.message.name, data.message.message));  
             
        }
    })
}
if (document.location.pathname === '/messaging') {
    // setInterval(function() {
    //     var elem = document.querySelector('.messages_container');
    //     elem.scrollTop = elem.scrollHeight;
    // }, 1500);
    let getMessagesInterval = setInterval(() => {
        if (!currentGroup)
        return;
        if (currentGroup !== currentTempGroup) {
            currentTempGroup = currentGroup;
            document.querySelector('.messages_container').innerHTML = '';
        }
        getLatestMessage(currentGroup);
    },1500)
    let scrollInterval = setInterval(() => {
        scrollMessages();
    },500)
}
const makeGroupModal  = _ => {
    let parentElement = document.createElement('div');
    parentElement.classList.add('modal');
    let groupNameElement = document.createElement('input');
    groupNameElement.classList.add('group_name_input');
    groupNameElement.placeholder = 'Group Name';
    let groupMembersElement = document.createElement('input');
    groupMembersElement.classList.add('group_members_input');
    groupMembersElement.placeholder = 'Group Members (separate with commas)';
    let groupSubmitElement = document.createElement('button');
    groupSubmitElement.classList.add('group_submit');
    groupSubmitElement.innerHTML = 'Create Group';
    groupSubmitElement.addEventListener('click', () => {
        let body = {
            username: PAGE_DATA.username,
            password: PAGE_DATA.password,
            group_name: groupNameElement.value,
            members: groupMembersElement.value.split(',').map(member => member.trim())
        }
        if (!body.group_name || !body.members) return alert('Please fill out all fields.');
        if (body.members.length < 2) return alert('Please add at least 2 members to your group.');
        fetch(`${document.location.origin}/api/create_group`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }).then(res => res.json()).then(data => {
            if (data.code === 200) {
                alert('Group created successfully! Please refresh the page to see your new group.');
                parentElement.remove();
            } else if (data.code === 403) {
                alert(`You are not logged in. ${data.message}`);
                window.location = `${document.location.origin}/signup`;
            } else {
                alert(`Error creating group: ${data.message}`);
            }
        })
    })
    parentElement.appendChild(groupNameElement);
    parentElement.appendChild(groupMembersElement);
    parentElement.appendChild(document.createElement('br'));
    parentElement.appendChild(groupSubmitElement);
    return parentElement;
}