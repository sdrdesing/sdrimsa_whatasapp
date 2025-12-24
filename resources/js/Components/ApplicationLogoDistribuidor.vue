<template>
    <img
        src="/logos/sdrimsac.png"
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
        computedSize() {
            return typeof this.size === 'number' ? `${this.size}px` : this.size;
        },
    },
};
</script>