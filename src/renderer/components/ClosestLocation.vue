<template>
  <Modal :is-visible="isVisible" @close="emit('close')">
    <div class="closest-location-modal">
      <div ref="panorama" class="panorama-container"></div>
      <button @click="emit('close')" class="close-button">Close</button>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue';
import Modal from './ui/Modal.vue';

const props = defineProps<{
  isVisible: boolean;
  location: LatLng | null;
}>();

const emit = defineEmits(['close']);

const panorama = ref<HTMLElement | null>(null);
const panoramaInstance = ref<google.maps.StreetViewPanorama | null>(null);

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
}

watch(() => props.isVisible, async (isVisible) => {
  if (isVisible && props.location) {
    // ensure the ref is mounted in the DOM
    await nextTick();
    if (!panorama.value) return;

    // If there's an existing instance, clean it first so we can recreate safely
    cleanupPanorama();

    const streetViewService = new google.maps.StreetViewService();
    streetViewService.getPanorama({
      location: props.location,
      radius: 5000,
      source: google.maps.StreetViewSource.OUTDOOR,
    }, (data, status) => {
      if (status === 'OK' && data && data.location && data.location.pano && panorama.value) {
        // create a fresh panorama instance bound to the current container
        panoramaInstance.value = new google.maps.StreetViewPanorama(panorama.value, {
          addressControl: false,
          showRoadLabels: false,
        });
        panoramaInstance.value.setPano(data.location.pano);
        panoramaInstance.value.setVisible(true);
      } else {
        if (panorama.value) {
          panorama.value.innerHTML = '<p>No Street View found for this location.</p>';
        }
      }
    });
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
