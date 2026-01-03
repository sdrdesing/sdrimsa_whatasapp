<template>
    <img
        :src="logo"
        :alt="alt"
        :style="{ width: computedSize, height: computedSize }"
        class="object-contain"
    />
</template>
<script>
export default {
    props: {
        // size can be a number (pixels) or any valid CSS size string (e.g. '4rem', '100px')
        size: {
            type: [String, Number],
            default: 64,
        },
        alt: {
            type: String,
            default: 'Application Logo',
        },
    },
    computed: {
        logo() {
            // @vite-ignore
            return new URL('../../public/logos/sdrimsac.png', import.meta.url).href;
        },
        computedSize() {
            return typeof this.size === 'number' ? `${this.size}px` : this.size;
        },
    },
};
</script>