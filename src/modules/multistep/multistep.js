
export function Multistep({ form, module }) {
    const defaults = {
        enabled: true,
        currentStep: 0,
        prevStep: 0,
        nextButton: form.$form.find('[data-form-multistep-next-button]') || form.$form.find(':submit') || null,
        prevButton: form.$form.find('[data-form-multistep-prev-button]') || null,
        progressBar: false,
        animate: true,
        animateDuration: 500,
        stepElements: form.$form.find('[data-form-step]'),
        _offsetTop: 0,
    }

    const moduleCopy = { ...module };
    const Multistep = Object.assign(module, defaults, moduleCopy);

    function init() {
        initMultiStep();
    }

    function initMultiStep() {
        Multistep.currentStep = 0;
        Multistep.prevStep = 0;

        initProgressBar();

        showTab();

        Multistep.nextButton.off('click.next').on('click.next', () => nextStepHandler());
        Multistep.prevButton.off('click.prev').on('click.prev', () => prevStepHandler());
    }

    function initProgressBar() {
        if (
            form.$form.find('[data-form-progressbar]').length === 0 &&
            Multistep.progressBar
        ) {
            appendProgressBar();
        }
    }

    function appendProgressBar() {
        const progressBarTemplate = [`<progress data-form-progressbar="" class="uk-progress" style="width: 100%" value="${Multistep.currentStep}" max="${Multistep.stepElements.length - 1}"</progress>`].join('');

        form.$form.find('[data-form-container]').prepend(progressBarTemplate);
    }

    function moveProgressBar() {
        const $progressBar = form.$form.find('[data-form-progressbar]');

        $progressBar.val(Multistep.currentStep);
    }

    function showTab() {
        buttonsCheckAndUpdate();

        if (Multistep.animate && Multistep.prevStep !== Multistep.currentStep) {
            animateStep();
        } else {
            $(Multistep.stepElements[Multistep.prevStep]).addClass('uk-hidden');
            $(Multistep.stepElements[Multistep.currentStep]).removeClass('uk-hidden');
        }

        moveProgressBar();
    }

    function buttonsCheckAndUpdate() {
        Multistep.currentStep === 0
            ? Multistep.prevButton.addClass('uk-hidden')
            : Multistep.prevButton.removeClass('uk-hidden');

        Multistep.currentStep === (Multistep.stepElements.length - 1)
            ? Multistep.nextButton.text('Подтвердить')
            : Multistep.nextButton.text('Далее');
    }

    function nextStepHandler() {
        const inputsToValidate = $(Multistep.stepElements[Multistep.currentStep]).find(':input');
        const { error, focusElem } = form.validateData(inputsToValidate);

        if (error) {
            form.scrollToElem(focusElem);
            return false;
        };

        if (Multistep.currentStep >= (Multistep.stepElements.length - 1)) {
            return form.$form.submit();
        }

        Multistep.prevStep = Multistep.currentStep;
        Multistep.currentStep += 1;

        // Сброс к максимальному шагу
        if (Multistep.currentStep > Multistep.stepElements.length - 1) return Multistep.currentStep = Multistep.stepElements.length;

        showTab();
    }

    function prevStepHandler() {
        Multistep.prevStep = Multistep.currentStep;
        Multistep.currentStep -= 1;

        // Сброс к минимальному шагу
        if (Multistep.currentStep < 0) return Multistep.currentStep = 0;

        showTab();
    }

    function animateStep() {
        $(Multistep.stepElements[Multistep.currentStep]).addClass('uk-hidden');
        $(Multistep.stepElements[Multistep.currentStep]).removeClass('uk-hidden');

        const isMovedForward = Multistep.currentStep > Multistep.prevStep;

        // Костыль чтобы формы всегда на первоначальной высоте были
        const offsetFirstStep = $(Multistep.stepElements[Multistep.prevStep]).position().top;

        if (!Multistep._offsetTop) {
            Multistep._offsetTop = offsetFirstStep;
        };

        $(Multistep.stepElements[Multistep.prevStep]).stop().animate({ opacity: 0 }, {
            step: (now) => {
                const transformCur = now * 100;
                const transformPrev = (-(1 - now) * 100);
                const opacity = 1 - now;

                $(Multistep.stepElements[Multistep.prevStep]).css({
                    'transform': `translateX(${isMovedForward ? transformPrev : -transformPrev}%)`,
                    'position': 'absolute',
                    'top': Multistep._offsetTop,
                    'width': '100%',
                });

                $(Multistep.stepElements[Multistep.currentStep]).css({
                    'transform': `translateX(${isMovedForward ? transformCur : -transformCur}%)`,
                    'opacity': opacity,
                });

                form.$form.find('[data-form-multistep-buttons]').css({
                    'opacity': opacity,
                });
            },
            duration: Multistep.animateDuration ?? 500,
            complete: () => {
                $(Multistep.stepElements[Multistep.prevStep]).addClass('uk-hidden').attr('style', '');
            },
        });

        animateformContainerHeight();
    }

    function animateformContainerHeight() {
        const $element = $(form.container);
        const curHeight = $element.height();
        const autoHeight = $element.css('height', 'auto').height();

        $element.height(curHeight);
        $element.stop().animate({ height: autoHeight }, Multistep.animateDuration ?? 500);
    }

    return init();
}