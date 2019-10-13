let userId = "";

class Api {
    constructor(options) {
        this.options = options;
    }

    getInitialCards(successCallback) {
        return this.process(fetch(`${this.options.baseUrl}/cards`, {
            headers: this.options.headers
        }), successCallback)

    }

    getUserInfo(successCallback) {
        return this.process(fetch(`${this.options.baseUrl}/users/me`, {
            headers: this.options.headers
        }), successCallback)
    }

    updateUserInfo(name, about, successCallback) {
        this.process(fetch(`${this.options.baseUrl}/users/me`, {
            method: 'PATCH',
            headers: this.options.headers,
            body: JSON.stringify({
                name: name,
                about: about
            })
        }), successCallback)

    }

    process(promise, successCallback) {
        promise
            .then(res => {
                    if (res.ok) {
                        return res.json()
                    } else {
                        return Promise.reject(`Ошибка: ${res.status}`);
                    }
                }
            )
            .then(successCallback)
            .catch(err => console.log(err));
    }

    postCard(name, link, successCallback) {
        this.process(fetch(`${this.options.baseUrl}/cards`, {
            method: 'POST',
            headers: this.options.headers,
            body: JSON.stringify({
                name: name,
                link: link
            })
        }), successCallback)
    }

    deleteCard(id, successCallback) {
        this.process(fetch(`${this.options.baseUrl}/cards/${id}`, {
            method: 'DELETE',
            headers: this.options.headers
        }), successCallback)
    }

}

class Card {
    constructor(name, link, id, isDeleteIconVisible) {
        this.name = name;
        this.link = link;
        this.id = id;
        this.cardContainer = this.create(isDeleteIconVisible);
    }

    like(event) {
        event.target.classList.toggle('place-card__like-icon_liked');
    }

    remove(event) {
        if (window.confirm('Вы действительно хотите удалить эту карточку?')) {
            api.deleteCard(this.id, data => {
                    event.target.closest('.place-card').remove();
                }
            )
        }
    }

    create(isDeleteIconVisible) {
        const placeCard = document.createElement('div'); //родительский элемент
        placeCard.classList.add('place-card');
        const placeCardImg = document.createElement('div'); // 1ур
        placeCard.appendChild(placeCardImg);
        placeCardImg.classList.add('place-card__image');
        placeCardImg.setAttribute('style', 'background-image: url(' + this.link + ')');
        const placeCardDelete = document.createElement('button'); // 2ур
        placeCardImg.appendChild(placeCardDelete);
        if (isDeleteIconVisible) {
            placeCardDelete.classList.add('place-card__delete-icon')
        } else {
            placeCardDelete.classList.add('place-card__delete-icon_none')
        }

        const placeCardDescription = document.createElement('div'); // 1ур
        placeCard.appendChild(placeCardDescription);
        placeCardDescription.classList.add('place-card__description');
        const placeCardText = document.createElement('h3'); // 2ур
        placeCardDescription.appendChild(placeCardText);
        placeCardText.classList.add('place-card__name');
        placeCardText.textContent = this.name;
        const placeCardLike = document.createElement('button'); // 2ур
        placeCardDescription.appendChild(placeCardLike);
        placeCardLike.classList.add('place-card__like-icon');
        placeCard.setAttribute('id', this.id)
        return placeCard;
    }
}

class CardList {
    constructor(container) {
        this.container = container;
        this.cards = [];
    }

    addCard(cardData) {
        let isDeleteIconVisible
        if (cardData.owner._id === userId) {
            isDeleteIconVisible = true
        } else {
            isDeleteIconVisible = false
        }
        const card = new Card(cardData.name, cardData.link, cardData._id, isDeleteIconVisible)
        this.cards.push(card);
        this.container.appendChild(card.cardContainer);
    }

    likeCard(event, id){
    	const card = this.cards.find(card => card.id === id)
    	if(card !== null){
    		card.like(event)
    	}
    }

    deleteCard(event, id){
		const card = this.cards.find(card => card.id === id)
    	if(card !== null){
    		card.remove(event)
    	}
    }

}

class Popup {
    constructor(container) {
        this.container = container;
    }

    open() {
        this.container.classList.add('popup_is-opened');
    }

    close() {
        this.container.classList.remove('popup_is-opened');
    }
}

// ПЕРЕМЕННЫЕ
const button = document.querySelector('.button');
const placeList = document.querySelector('.places-list');
const form = document.forms.new;
const popupButton = document.querySelector('.popup__button');
const buttonEdit = document.querySelector('.user-info__button-edit');
const formUser = document.forms.data;
const buttonClose = document.querySelectorAll('.popup__close'); // псевдомассив всех кнопок с классом
const popupFirstElement = document.querySelector('.popup_first');
const popupSecondElement = document.querySelector('.popup_second');
const image = document.querySelector('.image');
const imageContent = document.querySelector('.image__content');
const popups = document.querySelector('.popups'); // самая верхняя оболочка для popup и img
const userInfoName = document.querySelector('.user-info__name');
const userInfoJob = document.querySelector('.user-info__job');
const userInfoAvatar = document.querySelector('.user-info__photo');
const cardList = new CardList(placeList);
const popupFirst = new Popup(popupFirstElement);
const popupSecond = new Popup(popupSecondElement);

const api = new Api({
    baseUrl: 'http://95.216.175.5/cohort3',
    headers: {
        authorization: '0d5b5599-695b-4d75-afbb-16b992ef7f36',
        'Content-Type': 'application/json'
    }
});

api.getUserInfo(data => {
    userInfoName.textContent = data.name;
    userInfoJob.textContent = data.about;
    userInfoAvatar.style.backgroundImage = `url(${data.avatar})`;
    userId = data._id;
});

api.getInitialCards(data => {
    data.forEach(card => cardList.addCard(card))
});


// меняет имя автора
function renameUserInfo(event) {
    event.preventDefault();
    const formUser = document.forms.data;
    const userName = formUser.elements.name;
    const userJob = formUser.elements.job;
    api.updateUserInfo(userName.value, userJob.value, data => {
        userInfoName.textContent = data.name;
        userInfoJob.textContent = data.about;
    });
    form.reset();
    popupSecond.close();
}

// добавление контейнера
function addCard(event) {
    event.preventDefault();
    const formName = form.elements.name;
    const formLink = form.elements.link;
    api.postCard(formName.value, formLink.value, data => {
        cardList.addCard(data);
    });
    popupFirst.close();
    form.reset();
    popupButton.setAttribute('disabled', true);
    popupButton.classList.remove('popup__button_black');
}

buttonClose.forEach(function (elem) {
    elem.addEventListener('click', () => popupFirst.close());
});
buttonClose.forEach(function (elem) {
    elem.addEventListener('click', () => popupSecond.close());
});

// проверка для формы
function handleValidate(event) {
    reset(event.target);
    validate(event.target);
}

function validate(element) {
    const errorElement = document.querySelector(`#error-${element.id}`);

    if (!element.checkValidity()) {
        errorElement.textContent = 'Это обязательное поле';
        setError(errorElement);
        return false;
    } else if (element.value.length < 2 || element.value.length > 30) {
        setError(errorElement);
        errorElement.textContent = 'Должно быть от 2 до 30 символов';
        return false;
    }
    return true;
}

function setError(element) {
    element.classList.add('error-message_is-displayed');
}

function reset(element) {
    const errorElement = document.querySelector(`#error-${element.id}`);
    errorElement.classList.remove('error-message_is-displayed');
}

// закрытие карточки
function imageClose(event) {
    if (event.target.classList.contains('image__close')) {
        image.classList.remove('image_is-opened');
        const imgRemove = imageContent.querySelectorAll('img');
        imageContent.removeChild(imgRemove[1]);
    }
}

// открытие картинки
function imageOpen(event) {
    if (event.target.classList.contains('place-card__image')) {
        image.classList.add('image_is-opened');
        const stringFrom = event.target.getAttribute('style');
        const imgElement = document.createElement('img');
        let url = stringFrom
            .replace('background-image: url(', '')
            .replace(')', '');

        imgElement.setAttribute('src', url);
        imgElement.classList.add('image__element');
        imageContent.appendChild(imgElement);
    }
}
function openSecondPopup(event) {
    popupButtonAll[1].classList.add('popup__button_black');
    const formUser = document.forms.data;
    const userName = formUser.elements.name;
    const userJob = formUser.elements.job;
    const userInfoName = document.querySelector('.user-info__name');
    const userInfoJob = document.querySelector('.user-info__job');
    userName.value = userInfoName.textContent;
    userJob.value = userInfoJob.textContent;
    popupSecond.open();
}

function validateForm(event){
    const formUser = document.forms.data;
    const userName = formUser.elements.name;
    const userJob = formUser.elements.job;

    const isUserNameIsNotValid = userName.value.length < 2 || userName.value.length > 30;
    const isUserJobIsNotValid = userJob.value.length < 2 || userJob.value.length > 30;

    if (!isUserJobIsNotValid && !isUserNameIsNotValid) {
        popupButtonAll[1].classList.add('popup__button_black');
        popupButtonAll[1].removeAttribute('disabled');
    } else {
        popupButtonAll[1].classList.remove('popup__button_black');
        popupButtonAll[1].setAttribute('disabled', true);
    }
}
function blackButtonVisibility(event) {
    const formName = form.elements.name;
    const formLink = form.elements.link;
    if (formName.value.length !== 0 && formLink.value.length !== 0 && checkUrl(formLink.value)) {
        popupButton.classList.add('popup__button_black');
    } else {
        popupButton.classList.remove('popup__button_black');
    }
}

function popupButtonValidate(event) {
    const formName = form.elements.name;
    const formLink = form.elements.link;
    if (formName.value.length !== 0 && formLink.value.length !== 0 && checkUrl(formLink.value)) {
        popupButton.removeAttribute('disabled');
    } else {
        popupButton.setAttribute('disabled', true);
    }
}

function buttonDelegate(e) {
  if(e.target.classList.contains('place-card__like-icon')){
    cardList.likeCard(event, e.target.closest('.place-card').getAttribute('id'));
  }
  if(e.target.classList.contains('place-card__delete-icon')){
    cardList.deleteCard(event, e.target.closest('.place-card').getAttribute('id'));
  }
};

function checkUrl(url) {
    return url.startsWith('http');
}

// СОБЫТИЯ
// активность кнопки по заполнению строк
form.addEventListener('input', popupButtonValidate);

// черная кнопка
form.addEventListener('input', blackButtonVisibility);

// событие отправки того, что записали в формы
form.addEventListener('submit', addCard);

// показыть скрытый блок
button.addEventListener('click', () => popupFirst.open());
buttonEdit.addEventListener('click', openSecondPopup);

// событие для второй формы
formUser.addEventListener('submit', renameUserInfo);

// черная кнопка 2
const popupButtonAll = document.querySelectorAll('.popup__button');
formUser.addEventListener('input', validateForm);

// открытие карточки по нажатию на картинку
placeList.addEventListener('click', imageOpen);

// закрытие каточки по клику на крестик
popups.addEventListener('click', imageClose);

// валидация
formUser.name.addEventListener('input', handleValidate);
formUser.job.addEventListener('input', handleValidate);


// кнопка опять белая
popupButton.setAttribute('disabled', true);

// слушатель с делегированием
placeList.addEventListener('click', buttonDelegate);