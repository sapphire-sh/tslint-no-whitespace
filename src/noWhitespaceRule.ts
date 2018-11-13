import * as ts from 'typescript';
import * as utils from 'tsutils';
import * as Lint from 'tslint';

const singeLineConfigOptionName = 'singleLine';
interface Options {
	[singeLineConfigOptionName]?: 'never' | 'always';
}

export class Rule extends Lint.Rules.AbstractRule {
	public static metadata: Lint.IRuleMetadata = {
		'ruleName': 'no-whitespace',
		'description': 'Enforces whitespace style conventions.',
		'rationale': 'Helps maintain a readable, consistent style in your codebase.',
		'optionsDescription': `\`{${singeLineConfigOptionName}: "always"}\` enforces whitespace style`,
		'options': {
			'type': 'object',
			'properties': {
				[singeLineConfigOptionName]: {
					'type': 'string',
					'enum': [
						'always',
						'never',
					] as Array<Options['singleLine']>,
				},
			},
		},
		'type': 'style',
		'typescriptOnly': false,
		'hasFix': true,
	};

	public static FAILURE_STRING_EXCESSIVE = 'excessive whitespace';
	public static FAILURE_STRING_INVALID = 'invalid whitespace';

	public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
		return this.applyWithFunction(sourceFile, walk, this.getRuleOptions());
	}

	private getRuleOptions(): Options {
		if (this.ruleArguments[0] === undefined) {
			return {};
		}
		return this.ruleArguments[0] as Options;
	}
}

function walk(ctx: Lint.WalkContext<Options>) {
	const {
		sourceFile,
	} = ctx;

	let prevTokenShouldNotBeFollowedByWhitespace = false;
	utils.forEachTokenWithTrivia(sourceFile, (_, tokenKind, range) => {
		if (tokenKind === ts.SyntaxKind.OpenParenToken) {
			prevTokenShouldNotBeFollowedByWhitespace = false;
			return;
		}
		else if (prevTokenShouldNotBeFollowedByWhitespace) {
			addMissingWhitespaceErrorAt(range.pos);
			prevTokenShouldNotBeFollowedByWhitespace = false;
		}
		// check for trailing space after the given tokens
		switch (tokenKind) {
			case ts.SyntaxKind.CatchKeyword:
			case ts.SyntaxKind.ForKeyword:
			case ts.SyntaxKind.IfKeyword:
			case ts.SyntaxKind.SwitchKeyword:
			case ts.SyntaxKind.WhileKeyword:
			case ts.SyntaxKind.WithKeyword:
				prevTokenShouldNotBeFollowedByWhitespace = true;
				break;
		}
	});

	function addMissingWhitespaceErrorAt(position: number): void {
		// TODO: this rule occasionally adds duplicate failures.
		const failure = ctx.failures.some((f) => {
			return f.getStartPosition().getPosition() === position;
		});
		if (failure) {
			return;
		}
		const fix = Lint.Replacement.deleteText(position, 1);
		ctx.addFailureAt(position, 1, Rule.FAILURE_STRING_EXCESSIVE, fix);
	}
}
