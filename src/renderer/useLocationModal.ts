import { ref } from 'vue';

export function useLocationModal() {
  const isLocationModalVisible = ref(false);
  const location = ref<LatLng | null>(null);

  function showLocationModal(loc: LatLng) {
    location.value = loc;
    isLocationModalVisible.value = true;
  }

  function hideLocationModal() {
    isLocationModalVisible.value = false;
    location.value = null;
  }

  return {
    isLocationModalVisible,
    location,
    showLocationModal,
    hideLocationModal,
  };
}
