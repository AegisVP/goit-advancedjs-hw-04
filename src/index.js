import axios from 'axios';
import { Notify } from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import debounce from 'lodash.debounce';
import 'simplelightbox/dist/simple-lightbox.min.css';

const DEBOUNCE_DELAY = 250;

const refs = {
  searchForm: document.querySelector('form#search-form'),
  gallery: document.querySelector('.gallery'),
  observerSentry: document.querySelector('.gallery__sentry'),
  loadingImg: document.querySelector('.gallery__loading'),
  searchQuery: document.querySelector('form > input[name="searchQuery"]'),
};

const observerOptions = {
  root: null,
  rootMargin: '0px 0px 300px 0px',
  threshold: 1,
};

let page = null;
let perPage = 40;
let searchQuery = null;
let myGalleryLightbox = null;

const onObserverCall = debounce(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      getPictures(searchQuery);
    }
  });
}, DEBOUNCE_DELAY);

const onSearchSubmit = e => {
  e.preventDefault();
  page = 1;
  searchQuery = e.currentTarget.searchQuery.value
    .replaceAll(new RegExp(/>|</, 'g'), '')
    .trim();

  clearGallery();
  getPictures(searchQuery);
};

const formSearchQueryUrl = q => {
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
};

const getPictures = async (q = '') => {
  if (q === '' || q.length > 100) {
    Notify.failure('Invalid query');

    clearGallery();
    return;
  }

  try {
    showLoadingAnimation(true);
    const response = await axios.get(formSearchQueryUrl(q));
    showLoadingAnimation(false);

    const { hits, totalHits } = response.data;

    if (totalHits > 0) {
      showResults({ hits, totalHits });

      if (page !== 1) {
        myGalleryLightbox.refresh();
      } else {
        myGalleryLightbox = new SimpleLightbox('.gallery a.gallery__link', {});
        Notify.success(`Hooray! We found ${totalHits} images.`);
      }

      page += 1;
    } else {
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );

      clearGallery();
    }
  } catch (error) {
    clearGallery();
    Notify.failure('Error searching');
    Notify.failure(error.message);
    showLoadingAnimation(false);
  }
};

const showResults = ({ hits: results, totalHits }) => {
  observer.unobserve(refs.observerSentry);

  refs.gallery.insertAdjacentHTML(
    'beforeend',
    results
      .map(
        ({
          largeImageURL,
          webformatURL,
          tags,
          likes,
          views,
          comments,
          downloads,
        }) => `
      <a class="gallery__link" href="${largeImageURL}">
        <div class="gallery__photo-card">
          <div class="gallery__image-container">
            <img class="gallery__image" src="${webformatURL}" alt="${tags}" loading="lazy" />
          </div>
          <div class="gallery__info">
            <p class="gallery__info-item">
              <b>Likes<br>${likes}</b>
            </p>
            <p class="gallery__info-item">
              <b>Views<br>${views}</b>
            </p>
            <p class="gallery__info-item">
              <b>Comments<br>${comments}</b>
            </p>
            <p class="gallery__info-item">
              <b>Downloads<br>${downloads}</b>
            </p>
          </div>
        </div>
      </a>`
      )
      .join('')
  );

  if (page * perPage >= totalHits) {
    reachedEndOfList();
  } else {
    observer.observe(refs.observerSentry);
  }
};

const showLoadingAnimation = (show = true) => {
  if (show) refs.loadingImg.classList.remove('is-hidden');
  else refs.loadingImg.classList.add('is-hidden');
};

const clearGallery = () => {
  observer.unobserve(refs.observerSentry);

  refs.gallery.innerHTML = '';
  refs.searchQuery.focus();
};

const reachedEndOfList = () => {
  Notify.info("You've reached the end of search results");
  observer.unobserve(refs.observerSentry);
};

refs.searchForm.addEventListener('submit', onSearchSubmit);
const observer = new IntersectionObserver(onObserverCall, observerOptions);
