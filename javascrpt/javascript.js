document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault(); // Mencegah perilaku default
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Animasi Scroll
window.addEventListener("scroll", function() {
    let elements = document.querySelectorAll(".animate-on-scroll");
    let windowHeight = window.innerHeight;
    elements.forEach(el => {
        let position = el.getBoundingClientRect().top;
        if (position < windowHeight - 100) {
            el.classList.add("fade-in");
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const links = document.querySelectorAll("nav ul li a");

    links.forEach(link => {
        link.addEventListener("mouseover", function () {
            link.style.transition = "color 0.3s ease, transform 0.3s ease";
        });

        link.addEventListener("mouseout", function () {
            link.style.transition = "color 0.3s ease, transform 0.3s ease";
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".hobby-carousel").forEach(carousel => {
        const track = carousel.querySelector(".hobby-video-track");
        let cards = Array.from(track.querySelectorAll(".hobby-video-card"));
        const previousButton = carousel.querySelector(".hobby-carousel-previous");
        const nextButton = carousel.querySelector(".hobby-carousel-next");
        const isMusicCarousel = carousel.classList.contains("hobby-carousel-music");
        let activeIndex = 0;
        let navigationTarget = null;
        let scrollFrame = null;
        let wrapTimeout = null;
        let isReady = false;

        if (cards.length < 2) {
            previousButton.hidden = true;
            nextButton.hidden = true;
        } else {
            const cloneCount = isMusicCarousel ? 2 : 1;
            for (let index = 0; index < cloneCount; index += 1) {
                const firstClone = cards[0].cloneNode(true);
                const lastClone = cards[cards.length - 1].cloneNode(true);
                firstClone.classList.add("hobby-video-card-clone");
                lastClone.classList.add("hobby-video-card-clone");
                firstClone.setAttribute("aria-hidden", "true");
                lastClone.setAttribute("aria-hidden", "true");
                track.append(firstClone);
                track.insertBefore(lastClone, cards[0]);
            }
            cards = Array.from(track.querySelectorAll(".hobby-video-card"));
            activeIndex = isMusicCarousel ? 3 : 1;
        }
        const initialIndex = activeIndex;

        const getCardScrollLeft = index =>
            cards[index].offsetLeft - (track.clientWidth - cards[index].offsetWidth) / 2;

        const centerCard = (index, behavior = "smooth") => {
            track.scrollTo({
                left: getCardScrollLeft(index),
                behavior
            });
        };

        const setActiveCard = index => {
            if (activeIndex !== index) {
                cards[activeIndex].querySelector("video").pause();
                activeIndex = index;
            }

            cards.forEach((card, cardIndex) => {
                card.classList.toggle("is-active", cardIndex === activeIndex);
            });
        };

        if (isMusicCarousel) {
            const cloneCount = 2;
            const originalCount = cards.length - cloneCount * 2;
            const musicInitialIndex = activeIndex;
            let musicTransitioning = false;
            let musicReady = false;
            let musicNavigationStarted = false;
            let musicManualScrolling = false;
            let musicScrollFrame = null;
            let musicFallbackTimeout = null;
            let musicNormalizeTimeout = null;
            let ignoreMusicScrollEnd = false;
            const queuedDirections = [];

            const setActiveMusicCard = index => {
                cards.forEach((card, cardIndex) => {
                    if (cardIndex !== index) {
                        card.querySelector("video").pause();
                    }
                });
                setActiveCard(index);
            };

            const logicalIndexFor = index => {
                if (index < cloneCount) {
                    return originalCount - 1;
                }
                if (index >= cloneCount + originalCount) {
                    return 0;
                }
                return index - cloneCount;
            };

            const normalizeMusicClone = () => {
                if (activeIndex < cloneCount
                    || activeIndex >= cloneCount + originalCount) {
                    activeIndex = activeIndex < cloneCount
                        ? cloneCount + originalCount - 1
                        : cloneCount;
                    ignoreMusicScrollEnd = true;
                    track.scrollLeft = getCardScrollLeft(activeIndex);
                    setActiveMusicCard(activeIndex);
                    clearTimeout(musicNormalizeTimeout);
                    musicNormalizeTimeout = setTimeout(() => {
                        ignoreMusicScrollEnd = false;
                    }, 100);
                }
            };

            const finishMusicTransition = () => {
                if (!musicTransitioning) {
                    return;
                }

                clearTimeout(musicFallbackTimeout);
                normalizeMusicClone();
                musicTransitioning = false;

                if (queuedDirections.length > 0) {
                    requestAnimationFrame(processMusicQueue);
                }
            };

            const processMusicQueue = () => {
                if (musicTransitioning || queuedDirections.length === 0) {
                    return;
                }

                const direction = queuedDirections.shift();
                const currentLogicalIndex = logicalIndexFor(activeIndex);
                const nextLogicalIndex = (currentLogicalIndex + direction + originalCount) % originalCount;
                const isWrapping = (direction > 0 && currentLogicalIndex === originalCount - 1)
                    || (direction < 0 && currentLogicalIndex === 0);
                const targetIndex = isWrapping
                    ? direction > 0 ? cloneCount + originalCount : cloneCount - 1
                    : nextLogicalIndex + cloneCount;
                musicTransitioning = true;
                setActiveMusicCard(targetIndex);
                track.scrollTo({
                    left: getCardScrollLeft(targetIndex),
                    behavior: "smooth"
                });
                clearTimeout(musicFallbackTimeout);
                musicFallbackTimeout = setTimeout(finishMusicTransition, 900);
            };

            const updateMusicActiveCard = () => {
                const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
                let closestIndex = 0;
                let closestDistance = Infinity;

                cards.forEach((card, index) => {
                    const cardRect = card.getBoundingClientRect();
                    const distance = Math.abs(cardRect.left + cardRect.width / 2 - trackCenter);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestIndex = index;
                    }
                });

                setActiveMusicCard(closestIndex);
            };

            const queueMusicMove = direction => {
                musicNavigationStarted = true;
                queuedDirections.push(direction);
                processMusicQueue();
            };

            previousButton.addEventListener("click", () => queueMusicMove(-1));
            nextButton.addEventListener("click", () => queueMusicMove(1));
            track.addEventListener("pointerdown", () => { musicManualScrolling = true; });
            track.addEventListener("wheel", () => { musicManualScrolling = true; }, { passive: true });

            track.addEventListener("scroll", () => {
                if (!musicReady || musicTransitioning || !musicManualScrolling) {
                    return;
                }
                if (musicScrollFrame !== null) {
                    cancelAnimationFrame(musicScrollFrame);
                }
                musicScrollFrame = requestAnimationFrame(updateMusicActiveCard);
            }, { passive: true });

            track.addEventListener("scrollend", () => {
                if (!musicReady || ignoreMusicScrollEnd) {
                    return;
                }
                if (musicTransitioning) {
                    finishMusicTransition();
                    return;
                }
                if (!musicManualScrolling) {
                    return;
                }
                musicManualScrolling = false;
                if (musicScrollFrame !== null) {
                    cancelAnimationFrame(musicScrollFrame);
                    musicScrollFrame = null;
                }
                updateMusicActiveCard();
                normalizeMusicClone();
                if (activeIndex >= cloneCount && activeIndex < cloneCount + originalCount) {
                    track.scrollTo({
                        left: getCardScrollLeft(activeIndex),
                        behavior: "smooth"
                    });
                }
            });

            if ("ResizeObserver" in window) {
                const musicResizeObserver = new ResizeObserver(() => {
                    if (!musicTransitioning) {
                        track.scrollLeft = getCardScrollLeft(activeIndex);
                    }
                });
                musicResizeObserver.observe(track);
            }

            cards[musicInitialIndex].classList.add("is-active");
            const positionInitialMusicCard = () => {
                if (!musicNavigationStarted) {
                    track.scrollLeft = getCardScrollLeft(musicInitialIndex);
                    musicReady = true;
                }
            };
            positionInitialMusicCard();
            window.addEventListener("load", positionInitialMusicCard, { once: true });
            setTimeout(positionInitialMusicCard, 100);
            if ("IntersectionObserver" in window) {
                const initialPositionObserver = new IntersectionObserver(entries => {
                    if (entries.some(entry => entry.isIntersecting)) {
                        positionInitialMusicCard();
                        initialPositionObserver.disconnect();
                    }
                }, { rootMargin: "100px" });
                initialPositionObserver.observe(carousel);
            }
            return;
        }

        const normalizeClonePosition = () => {
            if (cards.length > 2 && (activeIndex === 0 || activeIndex === cards.length - 1)) {
                const originalIndex = activeIndex === 0 ? cards.length - 2 : 1;
                track.scrollLeft = getCardScrollLeft(originalIndex);
                setActiveCard(originalIndex);
            }
            navigationTarget = null;
        };

        const updateActiveCard = () => {
            const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
            let closestIndex = 0;
            let closestDistance = Infinity;

            cards.forEach((card, index) => {
                const cardRect = card.getBoundingClientRect();
                const distance = Math.abs(cardRect.left + cardRect.width / 2 - trackCenter);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            });

            setActiveCard(closestIndex);
            clearTimeout(wrapTimeout);
            wrapTimeout = setTimeout(normalizeClonePosition, 180);
        };

        const moveCarousel = direction => {
            if (cards.length < 3) {
                return;
            }

            const originalCount = cards.length - 2;
            const currentIndex = navigationTarget === null ? activeIndex : navigationTarget;
            const logicalIndex = currentIndex === 0
                ? originalCount - 1
                : currentIndex === cards.length - 1
                    ? 0
                    : currentIndex - 1;
            const nextLogicalIndex = (logicalIndex + direction + originalCount) % originalCount;
            const targetIndex = direction > 0 && logicalIndex === originalCount - 1
                ? cards.length - 1
                : direction < 0 && logicalIndex === 0
                    ? 0
                    : nextLogicalIndex + 1;

            navigationTarget = targetIndex;
            centerCard(targetIndex);
        };

        previousButton.addEventListener("click", () => {
            moveCarousel(-1);
        });
        nextButton.addEventListener("click", () => {
            moveCarousel(1);
        });

        track.addEventListener("scroll", function () {
            if (!isReady) {
                return;
            }
            if (scrollFrame !== null) {
                cancelAnimationFrame(scrollFrame);
            }
            scrollFrame = requestAnimationFrame(updateActiveCard);
        }, { passive: true });

        track.addEventListener("scrollend", function () {
            if (!isReady) {
                return;
            }
            if (scrollFrame !== null) {
                cancelAnimationFrame(scrollFrame);
                scrollFrame = null;
            }
            updateActiveCard();
            clearTimeout(wrapTimeout);
            normalizeClonePosition();
        });

        cards[activeIndex].classList.add("is-active");
        requestAnimationFrame(() => {
            track.scrollLeft = getCardScrollLeft(activeIndex);
            setActiveCard(activeIndex);
            requestAnimationFrame(() => {
                isReady = true;
                updateActiveCard();
            });
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const videos = document.querySelectorAll(".hobby-carousel-featured video[autoplay]");
    const loadVideo = video => {
        const source = video.querySelector("source[data-src]");
        if (!source) {
            return;
        }

        source.src = source.dataset.src;
        delete source.dataset.src;
        video.load();
    };

    const playVideo = video => {
        video.play().catch(error => {
            if (error.name !== "AbortError" && error.name !== "NotAllowedError") {
                console.error("Video gagal diputar:", error);
            }
        });
    };

    if ("IntersectionObserver" in window) {
        const videoObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    loadVideo(video);
                    playVideo(video);
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.25 });

        videos.forEach(video => videoObserver.observe(video));
    } else {
        videos.forEach(video => {
            loadVideo(video);
            playVideo(video);
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("contact-form-status");
    const submitButton = form.querySelector(".btn-submit");
    const emailJsConfig = {
        serviceId: "service_0lx0a7g",
        templateId: "template_t2hiy47",
        senderConfirmationTemplateId: "template_hotljdv",
        publicKey: "Ud0wnkvuRBUChmYAZ"
    };

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if ([emailJsConfig.serviceId, emailJsConfig.templateId, emailJsConfig.publicKey]
            .some(value => value.startsWith("YOUR_"))) {
            status.textContent = "Form belum terhubung. Atur Service ID, Template ID, dan Public Key EmailJS terlebih dahulu.";
            return;
        }

        const senderDetails = {
            user_name: form.elements.user_name.value,
            user_email: form.elements.user_email.value,
            message: form.elements.message.value
        };

        status.textContent = "Mengirim pesan...";
        submitButton.disabled = true;

        emailjs.sendForm(
            emailJsConfig.serviceId,
            emailJsConfig.templateId,
            form,
            { publicKey: emailJsConfig.publicKey }
        ).then(() => {
            if (emailJsConfig.senderConfirmationTemplateId.startsWith("YOUR_")) {
                status.textContent = "Pesan berhasil dikirim. Email konfirmasi untuk pengirim belum diatur.";
                form.reset();
                return;
            }

            return emailjs.send(
                emailJsConfig.serviceId,
                emailJsConfig.senderConfirmationTemplateId,
                senderDetails,
                { publicKey: emailJsConfig.publicKey }
            ).then(() => {
                status.textContent = "Pesan berhasil dikirim dan email konfirmasi sudah dikirim ke pengirim.";
                form.reset();
            }).catch(error => {
                console.error("EmailJS gagal mengirim email konfirmasi:", error);
                status.textContent = "Pesan sudah terkirim kepada pemilik situs, tetapi email konfirmasi ke pengirim gagal dikirim.";
            });
        }).catch(error => {
            console.error("EmailJS gagal mengirim pesan:", error);
            status.textContent = "Pesan gagal dikirim. Silakan coba lagi nanti.";
        }).finally(() => {
            submitButton.disabled = false;
        });
    });
});

const elements = document.querySelectorAll(".reveal");

window.addEventListener("scroll", function () {
    elements.forEach(el => {
        const position = el.getBoundingClientRect().top;
        if (position < window.innerHeight - 100) {
            el.classList.add("active");
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("dark-mode-toggle");
    const body = document.body;

    // Cek jika dark mode sebelumnya diaktifkan
    if (localStorage.getItem("darkMode") === "enabled") {
        body.classList.add("dark-mode");
    }

    toggle.addEventListener("click", function () {
        body.classList.toggle("dark-mode");

        // Simpan preferensi dark mode di localStorage
        if (body.classList.contains("dark-mode")) {
            localStorage.setItem("darkMode", "enabled");
        } else {
            localStorage.removeItem("darkMode");
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const audio = document.getElementById("background-music");
    const toggleButton = document.getElementById("music-toggle");

    // Coba autoplay setelah halaman dimuat
    setTimeout(() => {
        audio.play().then(() => {
            toggleButton.textContent = "⏸ Pause Music"; // Ubah teks tombol jika berhasil autoplay
        }).catch(error => {
            console.log("Autoplay diblokir, user harus klik untuk play.");
        });
    }, 1000);

    // Toggle play/pause saat tombol ditekan
    toggleButton.addEventListener("click", function () {
        if (audio.paused) {
            audio.play();
            toggleButton.textContent = "⏸ Pause Music";
        } else {
            audio.pause();
            toggleButton.textContent = "▶ Play Music";
        }
    });
});

function fadeIn(audio) {
    let volume = 0;
    audio.volume = volume;
    audio.play();
    let fade = setInterval(() => {
        if (volume < 1) {
            volume += 0.1;
            audio.volume = volume;
        } else {
            clearInterval(fade);
        }
    }, 200);
}

toggleButton.addEventListener("click", function () {
    if (audio.paused) {
        fadeIn(audio);
        toggleButton.textContent = "⏸ Pause Music";
    } else {
        audio.pause();
        toggleButton.textContent = "▶ Play Music";
    }
});
