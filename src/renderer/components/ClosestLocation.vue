<template>
  <Modal :is-visible="isVisible" @close="emit('close')">
    <div class="closest-location-modal">
      <div ref="panorama" class="panorama-container"></div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue';
import { useStyleTag } from '@vueuse/core';
import Modal from './ui/Modal.vue';

const props = defineProps<{
  isVisible: boolean;
  location: LatLng | null;
  panoramaRadius?: number;
  panoramaSource?: string;
}>();

const emit = defineEmits(['close']);

const panorama = ref<HTMLElement | null>(null);
const panoramaInstance = ref<google.maps.StreetViewPanorama | null>(null);
// Style tag to temporarily hide guess markers while the panorama modal is showing
const hideGuessMarkers = useStyleTag('[data-qa="guess-marker"] { display: none !important; }', {
  id: 'cg-hide-guess-markers-panorama',
  manual: true
});

function cleanupPanorama() {
  if (panoramaInstance.value) {
    try {
      // hide and remove listeners from the existing panorama instance
      panoramaInstance.value.setVisible(false);
      if ((google as any).maps && (google as any).maps.event && (google as any).maps.event.clearInstanceListeners) {
        (google as any).maps.event.clearInstanceListeners(panoramaInstance.value);
      }
    } catch (e) {
      // ignore errors from the maps API during cleanup
    }
    panoramaInstance.value = null;
  }
  if (panorama.value) {
    panorama.value.innerHTML = '';
  }
  // Restore guess markers visibility when closing / cleaning up
  hideGuessMarkers.unload();
}

watch(() => props.isVisible, async (isVisible) => {
  if (isVisible && props.location) {
    // Suppress did-frame-finish-load side-effects in main process while
    // injecting Street View panorama (which creates iframes) to avoid
    // triggering game refresh logic.
    if (window?.chatguessrApi?.suppressFrameLoad) {
      window.chatguessrApi.suppressFrameLoad(1500)
    }
    // ensure the ref is mounted in the DOM
    await nextTick();
    if (!panorama.value) return;

    // If there's an existing instance, clean it first so we can recreate safely
    cleanupPanorama();

    const getPanoramaSource = (source?: string): google.maps.StreetViewSource => {
      switch (source) {
        case 'DEFAULT':
          return google.maps.StreetViewSource.DEFAULT;
        case 'OUTDOOR':
          return google.maps.StreetViewSource.OUTDOOR;
        case 'GOOGLE':
        default:
          return google.maps.StreetViewSource.GOOGLE;
      }
    };

    const streetViewService = new google.maps.StreetViewService();

    // Promisified helper for getPanorama so we can await it
    function getPanoramaPromise(options: google.maps.StreetViewLocationRequest) {
      return new Promise<{ data: any; status: string }>((resolve, reject) => {
        try {
          streetViewService.getPanorama(options, (data: any, status: string) => {
            if (status === google.maps.StreetViewStatus.OK) {
              resolve({ data, status })
            } else {
              // resolve with status so caller can decide to break or retry
              resolve({ data: null, status })
            }
          })
        } catch (e) {
          reject(e)
        }
      })
    }

    // Helper to compute distance between two coords using Google geometry
    function computeDistanceBetween(coords1: { lat: number; lng: number }, coords2: any) {
      try {
        const a = new google.maps.LatLng(coords1.lat, coords1.lng)
        return google.maps.geometry.spherical.computeDistanceBetween(a, coords2)
      } catch (e) {
        // fallback: return large distance
        return Number.MAX_SAFE_INTEGER
      }
    }

    // We'll attempt to converge to the nearest panorama similarly to onRetrieveMyLastLoc
    const searchRadiusStart = props.panoramaRadius || 250000
    let radius = searchRadiusStart
    let oldRadius = searchRadiusStart
    let foundPanoId: string | null = null

    while (true) {
      try {
        const res = await getPanoramaPromise({
          location: props.location!,
          preference: google.maps.StreetViewPreference.NEAREST,
          source: getPanoramaSource(props.panoramaSource),
          radius: radius,
        })
        if (!res || !res.data || !res.data.location) break

        const panoLatLng = res.data.location.latLng
        radius = computeDistanceBetween({ lat: props.location!.lat, lng: props.location!.lng }, panoLatLng)
        foundPanoId = res.data.location.pano

        if (oldRadius && radius >= oldRadius) break
        oldRadius = radius
      } catch (e) {
        console.error('ClosestLocation: error while searching for pano', e)
        break
      }
    }

    if (foundPanoId && panorama.value) {
      // create a fresh panorama instance bound to the current container
      panoramaInstance.value = new google.maps.StreetViewPanorama(panorama.value, {
        addressControl: false,
        showRoadLabels: false,
      })
      panoramaInstance.value.setPano(foundPanoId)
      panoramaInstance.value.setVisible(true)
      // Hide guess markers while modal panorama is visible
      hideGuessMarkers.load()
    } else {
      if (panorama.value) {
        panorama.value.innerHTML = '<p>No Street View found for this location.</p>'
      }
      // ensure markers remain visible if nothing found
      hideGuessMarkers.unload()
    }
  } else {
    // modal was closed or no location: cleanup
    cleanupPanorama();
  }
});

onUnmounted(() => {
  cleanupPanorama();
});
</script>

<style scoped>
.closest-location-modal {
  width: 80vw;
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.panorama-container {
  width: 100%;
  height: 100%;
  flex-grow: 1;
}

.close-button {
  margin-top: 10px;
  padding: 5px 10px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  align-self: center;
}
</style>
