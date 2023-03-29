cmsDefine(['script/form'], (Form) => {

    return class FormUser extends Form {
        constructor(...args) {
            super(...args);
        }

        init(...methods) {
            super.init(...methods);
            this.initMultiStep();
        }

        validateData() {
            const $inputsArr = $(this.multistep.stepElements[this.multistep.currentStep]).find(':input');
            return super.validateData($inputsArr);
        }

        initMultiStep() {
            this.multistep.currentStep = 0;
            this.multistep.prevStep = 0;
            // this.multistep.stepElements = $('[data-form-step]');

            this.initProgressBar();

            this.showTab();

            this.multistep.nextButton.off('click.next').on('click.next', () => this.nextStepHandler());
            this.multistep.prevButton.off('click.prev').on('click.prev', () => this.prevStepHandler());
        }

        initProgressBar() {
            if (
                this.$form.find('[data-form-progressbar]').length === 0 &&
                this.multistep.progressBar
            ) {
                this.appendProgressBar();
            }
        }

        appendProgressBar() {
            const progressBarTemplate = [`<progress data-form-progressbar="" class="uk-progress" style="width: 100%" value="${this.multistep.currentStep}" max="${this.multistep.stepElements.length - 1}"</progress>`].join('');

            this.$form.find('[data-form-container]').prepend(progressBarTemplate);
        }

        moveProgressBar() {
            const $progressBar = this.$form.find('[data-form-progressbar]');
            
            $progressBar.val(this.multistep.currentStep);
        }

        showTab() {
            this.buttonsCheckAndUpdate();

            if (this.multistep.animate && this.multistep.prevStep !== this.multistep.currentStep) {
                this.animateStep();
            } else {
                $(this.multistep.stepElements[this.multistep.prevStep]).addClass('uk-hidden');
                $(this.multistep.stepElements[this.multistep.currentStep]).removeClass('uk-hidden');
            }

            this.moveProgressBar();
        }

        buttonsCheckAndUpdate() {
            this.multistep.currentStep === 0
                ? this.multistep.prevButton.addClass('uk-hidden')
                : this.multistep.prevButton.removeClass('uk-hidden');

            this.multistep.currentStep === (this.multistep.stepElements.length - 1)
                ? this.multistep.nextButton.text('Подтвердить')
                : this.multistep.nextButton.text('Далее');
        }

        nextStepHandler() {
            const { error, focusElem } = this.validateData();

            if (error) {
                super.scrollToElem(focusElem);
                return false;
            };

            if (this.multistep.currentStep >= (this.multistep.stepElements.length - 1)) {
                return this.$form.submit();
            }

            this.multistep.prevStep = this.multistep.currentStep;
            this.multistep.currentStep += 1;

            // Сброс к максимальному шагу
            if (this.multistep.currentStep > this.multistep.stepElements.length - 1) return this.multistep.currentStep = this.multistep.stepElements.length;

            this.showTab();
        }

        prevStepHandler() {
            this.multistep.prevStep = this.multistep.currentStep;
            this.multistep.currentStep -= 1;

            // Сброс к минимальному шагу
            if (this.multistep.currentStep < 0) return this.multistep.currentStep = 0;

            this.showTab();
        }

        animateStep() {
            $(this.multistep.stepElements[this.multistep.currentStep]).addClass('uk-hidden');
            $(this.multistep.stepElements[this.multistep.currentStep]).removeClass('uk-hidden');

            const isMovedForward = this.multistep.currentStep > this.multistep.prevStep;
            const offsetFirstStep = $(this.multistep.stepElements[this.multistep.prevStep]).position().top;

            $(this.multistep.stepElements[this.multistep.prevStep]).stop().animate({ opacity: 0 }, {
                step: (now) => {
                    const transformCur = now * 100;
                    const transformPrev = (-(1 - now) * 100);
                    const opacity = 1 - now;

                    $(this.multistep.stepElements[this.multistep.prevStep]).css({
                        'transform': `translateX(${isMovedForward ? transformPrev : -transformPrev}%)`,
                        'position': 'absolute',
                        'top': offsetFirstStep,
                        'width': '100%',
                    });

                    $(this.multistep.stepElements[this.multistep.currentStep]).css({
                        'transform': `translateX(${isMovedForward ? transformCur : -transformCur}%)`,
                        'opacity': opacity,
                    });

                    this.$form.find('[data-form-multistep-buttons]').css({
                        'opacity': opacity
                    });
                },
                duration: this.multistep.animateDuration ?? 500,
                complete: () => {
                    $(this.multistep.stepElements[this.multistep.prevStep]).addClass('uk-hidden').attr('style', '');
                },
            });

            this.animateFormContainerHeight()

        }

        animateFormContainerHeight() {
            const $element = $(this.container);
            const curHeight = $element.height();
            const autoHeight = $element.css('height', 'auto').height();

            $element.height(curHeight);
            $element.stop().animate({ height: autoHeight }, this.multistep.animateDuration ?? 500);
        }
    }
})