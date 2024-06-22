import axios from 'axios';
import { Notify } from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import debounce from 'lodash.debounce';
import 'simplelightbox/dist/simple-lightbox.min.css';

const DEBOUNCE_DELAY = 250;

const refs = {
  searchForm: document.querySelector('form#search-form'),
  gallery: document.querySelector('.gallery'),
  loadingImg: document.querySelector('.gallery__loading'),
  searchQuery: document.querySelector('form > input[name="searchQuery"]'),
};

let page = null;
let perPage = 40;
let searchQuery = null;
let myGalleryLightbox = null;

const doScrollMonitor = debounce(() => {
  const nr = { ...refs, lastImage: refs.gallery.lastChild };
  const bounding = nr.lastImage?.getBoundingClientRect();
  const imgHeight = nr.lastImage?.offsetHeight;

  if (
    bounding.top >= -imgHeight &&
    bounding.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) + imgHeight
  ) {
    getPictures(searchQuery);
  }
}, DEBOUNCE_DELAY);

const onSearchSubmit = e => {
  e.preventDefault();
  page = 1;
  searchQuery = e.currentTarget.searchQuery.value
    .replaceAll(new RegExp(/>|</, 'g'), '')
    .trim();
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

  console.log({ searchQuery, page });
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
    }
  } catch (error) {
    console.error(error);

    clearGallery();
    Notify.failure('Error searching');
  }
};

const showResults = ({ hits: results, totalHits }) => {
  if (page * perPage >= totalHits) {
    reachedEndOfList();
  } else {
    window.addEventListener('scroll', doScrollMonitor);
  }

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
};

const showLoadingAnimation = (show = true) => {
  if (show) refs.loadingImg.classList.remove('is-hidden');
  else refs.loadingImg.classList.add('is-hidden');
};

const clearGallery = () => {
  refs.gallery.innerHTML = '';
  refs.searchQuery.focus();

  window.removeEventListener('scroll', doScrollMonitor);
};

const reachedEndOfList = () => {
  Notify.info("You've reached the end of search results");

  window.removeEventListener('scroll', doScrollMonitor);
};

refs.searchForm.addEventListener('submit', onSearchSubmit);
