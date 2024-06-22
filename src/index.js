import axios from 'axios';
import { Notify } from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import debounce from 'lodash.debounce';
import 'simplelightbox/dist/simple-lightbox.min.css';

const DEBOUNCE_DELAY = 250;
const doScrollMonitor = debounce(doInfiniteScroll, DEBOUNCE_DELAY);

const refs = {
  searchForm: document.querySelector('form#search-form'),
  loadMoreButton: document.querySelector('.gallery__loadmore-button'),
  gallery: document.querySelector('.gallery'),
  loadingImg: document.querySelector('.gallery__loading'),
  submitBtn: document.querySelector('form.search-form > button[type="submit"]'),
  searchQuery: document.querySelector('form > input[name="searchQuery"]'),
};

let page = null;
let perPage = 40;
let searchQuery = null;
let myGalleryLightbox = null;

refs.searchForm.addEventListener('submit', onSearchSubmit);
refs.searchQuery.addEventListener('input', onInput);
refs.loadMoreButton.addEventListener('click', onLoadMore);

// function doScrollMonitor() {
//   console.log('Scroll monitor fired');

// }

function doInfiniteScroll() {
  console.log('infinite scroll fired');
  const nr = { ...refs, lastImage: refs.gallery.lastChild };
  const bounding = nr.lastImage?.getBoundingClientRect();
  const imgHeight = nr.lastImage?.offsetHeight;

  console.log(nr);

  if (
    bounding.top >= -imgHeight &&
    bounding.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) + imgHeight
  ) {
    onLoadMore();
  }
}

function onLoadMore(e) {
  // e.preventDefault();
  // showLoadMoreButton(false);
  console.log('onloadmore, removing scroll listener');
  window.removeEventListener('scroll', doScrollMonitor);

  getPictures(searchQuery);
}

function onSearchSubmit(e) {
  e.preventDefault();
  page = 1;
  refs.submitBtn.disabled = true;
  searchQuery = e.currentTarget.searchQuery.value.trim();
  getPictures(searchQuery);
}

function onInput() {
  refs.submitBtn.disabled = false;
  clearGallery();
}

function formSearchQueryUrl(q) {
  const BASE_URL = 'https://pixabay.com/api';
  const OPTIONS = new URLSearchParams({
    orientation: 'horizontal',
    image_type: 'photo',
    safesearch: 'true',
    per_page: perPage,
    key: '28371758-065fc86b54820776754ee6bc7',
    page,
  });
  return `${BASE_URL}/?q=${q}&${OPTIONS.toString()}`;
}

async function getPictures(q = '') {
  if (q === '' || q.length > 100) {
    clearGallery();
    Notify.failure('Invalid query');
    return;
  }

  try {
    showLoadingAnimation(true);
    const response = await axios.get(formSearchQueryUrl(q));
    showLoadingAnimation(false);

    const { hits, totalHits } = response.data;

    if (totalHits > 0) {
      console.log(hits);

      showResults({ hits, totalHits });

      if (page !== 1) {
        myGalleryLightbox.refresh();
        // smoothScrollDown();
      } else {
        myGalleryLightbox = new SimpleLightbox('.gallery a.gallery__link', {});
        Notify.success(`Hooray! We found ${totalHits} images.`);
      }

      page += 1;
    } else {
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
    }
  } catch (error) {
    console.error(error);

    clearGallery();
    Notify.failure('Error searching');
  }
}

function showResults({ hits: results, totalHits }) {
  if (page * perPage >= totalHits) {
    reachedEndOfList();
  } else {
    // showLoadMoreButton(true);

    console.log('showresult, adding scroll listener');
    window.addEventListener('scroll', doScrollMonitor);
  }

  refs.gallery.insertAdjacentHTML(
    'beforeend',
    results
      .map(
        res => `
      <a class="gallery__link" href="${res.largeImageURL}">
        <div class="gallery__photo-card">
          <div class="gallery__image-container">
            <img class="gallery__image" src="${res.webformatURL}" alt="${res.tags}" loading="lazy" />
          </div>
          <div class="gallery__info">
            <p class="gallery__info-item">
              <b>Likes<br>${res.likes}</b>
            </p>
            <p class="gallery__info-item">
              <b>Views<br>${res.views}</b>
            </p>
            <p class="gallery__info-item">
              <b>Comments<br>${res.comments}</b>
            </p>
            <p class="gallery__info-item">
              <b>Downloads<br>${res.downloads}</b>
            </p>
          </div>
        </div>
      </a>`
      )
      .join('')
  );
}

function showLoadingAnimation(show = true) {
  if (show) {
    refs.loadingImg.classList.remove('is-hidden');
    // refs.loadingImg.scrollIntoView();
  } else refs.loadingImg.classList.add('is-hidden');
}

// function showLoadMoreButton(show = true) {
//   if (show) refs.loadMoreButton.classList.remove('is-hidden');
//   else refs.loadMoreButton.classList.add('is-hidden');
// }

function clearGallery() {
  // showLoadMoreButton(false);
  refs.gallery.innerHTML = '';
  refs.searchQuery.focus();

  console.log('cleargallery, removing scroll listener');
  window.removeEventListener('scroll', doScrollMonitor);
}

function reachedEndOfList() {
  // showLoadMoreButton(false);
  Notify.info("You've reached the end of search results");

  console.log('reachedendoflist, removing scroll listener');
  window.removeEventListener('scroll', doScrollMonitor);
}

// function smoothScrollDown() {
//   // get gallery card (first child of element "gallery") height and put to variable cardHeight
//   const { height: cardHeight } = document
//     .querySelector('.gallery')
//     .firstElementChild.getBoundingClientRect();

//   // smoothly scroll window horisontally (top) by the height of two cards (cardHeight * 2)
//   window.scrollBy({
//     top: cardHeight * 2,
//     behavior: 'smooth',
//   });
// }
