# How to Merge `newMobileFrontend` into `APRIL_MOBILE_FINAL`

This document covers the specific steps on how to merge the `newMobileFrontend` branch into the `APRIL_MOBILE_FINAL` branch.

## Main Steps

**Scenario:** You have finished working on the `newMobileFrontend` branch and you want to integrate those changes into your main working branch, `APRIL_MOBILE_FINAL`.

### 1. Check which branch you are currently on

Before you merge, make sure you know which branch you are currently on.

```bash
git branch
```
The branch with an asterisk (`*`) is your current branch. Ensure all your work on `newMobileFrontend` is committed.

### 2. Switch to the Target Branch (`APRIL_MOBILE_FINAL`)

You need to switch to the branch where you want to apply the new changes. This is the branch that will receive the merge.

```bash
git checkout APRIL_MOBILE_FINAL
```

### 3. Ensure the Target Branch is updated (Optional but recommended)

If you are working with a remote repository (like GitHub) and others might have made changes to `APRIL_MOBILE_FINAL`, pull the latest changes first.

```bash
git pull origin APRIL_MOBILE_FINAL
```

### 4. Merge `newMobileFrontend` into `APRIL_MOBILE_FINAL`

Now that you are on the `APRIL_MOBILE_FINAL` branch, merge the changes from `newMobileFrontend`.

```bash
git merge newMobileFrontend
```

### 5. Resolve Conflicts (If any)

If both branches modified the same line of code differently, you will face a "merge conflict". Git will notify you about this (it will say `CONFLICT (content): Merge conflict in...`).

*   Open the files with conflicts in your code editor (like VS Code).
*   Look for the conflict markers:
    ```
    <<<<<<< HEAD (Current Changes - what is in APRIL_MOBILE_FINAL)
    ...
    =======
    ...
    >>>>>>> newMobileFrontend (Incoming Changes)
    ```
*   Choose which code you want to keep (or combine them manually), then delete the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
*   Save the file.
*   Then, add the resolved files and create a merge commit:

```bash
git add .
git commit -m "Merge newMobileFrontend into APRIL_MOBILE_FINAL and resolve conflicts"
```

### 6. Push the changes 

If the merge is successful in your local repository, upload the updated `APRIL_MOBILE_FINAL` branch to your remote repository.

```bash
git push origin APRIL_MOBILE_FINAL
```

---

## Fast Method (If there are no conflicts)

If you are sure there will be no problems and you just want to do it quickly:

```bash
git checkout APRIL_MOBILE_FINAL
git pull origin APRIL_MOBILE_FINAL
git merge newMobileFrontend
git push origin APRIL_MOBILE_FINAL
```
